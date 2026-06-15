import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserBuilding } from './user-building.entity';
import { UserRole } from './user-role.enum';
import { UserBuildingLinkType } from './user-building-link-type.enum';
import * as bcrypt from 'bcrypt';

export interface UserListItem {
  id: string;
  email: string;
  role: UserRole;
  building_ids: string[];
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserBuilding)
    private userBuildingsRepository: Repository<UserBuilding>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<UserListItem[]> {
    const users = await this.usersRepository.find({
      order: { email: 'ASC' },
    });

    return Promise.all(
      users.map(async (user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        building_ids: await this.getAssignedBuildingIds(user.id),
      })),
    );
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async createUser(
    email: string,
    plainPassword: string,
    role: UserRole,
    buildingIds?: string[],
  ): Promise<UserListItem> {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('Użytkownik z tym adresem e-mail już istnieje');
    }

    const password_hash = await bcrypt.hash(plainPassword, 10);
    const user = this.usersRepository.create({
      email,
      password_hash,
      role,
    });
    const savedUser = await this.usersRepository.save(user);

    if (
      buildingIds &&
      buildingIds.length > 0 &&
      role === UserRole.DYREKTOR
    ) {
      for (const buildingId of buildingIds) {
        await this.assignBuildingToUser(
          savedUser.id,
          buildingId,
          UserBuildingLinkType.ASSIGNED,
        );
      }
    }

    return {
      id: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
      building_ids: await this.getAssignedBuildingIds(savedUser.id),
    };
  }

  async updateUserBuildings(
    userId: string,
    buildingIds: string[],
  ): Promise<UserListItem> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Użytkownik nie został znaleziony');
    }

    if (user.role !== UserRole.DYREKTOR) {
      throw new ConflictException(
        'Przypisanie budynków przez urzędnika jest dostępne tylko dla dyrektora',
      );
    }

    await this.userBuildingsRepository.delete({
      user_id: userId,
      link_type: UserBuildingLinkType.ASSIGNED,
    });

    for (const buildingId of buildingIds) {
      await this.assignBuildingToUser(
        userId,
        buildingId,
        UserBuildingLinkType.ASSIGNED,
      );
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      building_ids: buildingIds,
    };
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Użytkownik nie został znaleziony');
    }

    if (user.role === UserRole.URZEDNIK) {
      throw new ConflictException('Nie można usunąć konta urzędnika');
    }

    await this.usersRepository.delete(userId);
  }

  async getFavoriteBuildingIds(userId: string): Promise<string[]> {
    return this.getBuildingIdsByLinkType(userId, UserBuildingLinkType.FAVORITE);
  }

  async getAssignedBuildingIds(userId: string): Promise<string[]> {
    return this.getBuildingIdsByLinkType(userId, UserBuildingLinkType.ASSIGNED);
  }

  async addFavoriteBuilding(userId: string, buildingId: string): Promise<void> {
    const existing = await this.userBuildingsRepository.findOne({
      where: {
        user_id: userId,
        building_id: buildingId,
        link_type: UserBuildingLinkType.FAVORITE,
      },
    });

    if (existing) {
      return;
    }

    await this.assignBuildingToUser(
      userId,
      buildingId,
      UserBuildingLinkType.FAVORITE,
    );
  }

  async removeFavoriteBuilding(userId: string, buildingId: string): Promise<void> {
    await this.userBuildingsRepository.delete({
      user_id: userId,
      building_id: buildingId,
      link_type: UserBuildingLinkType.FAVORITE,
    });
  }

  async hasFavoriteBuilding(userId: string, buildingId: string): Promise<boolean> {
    const link = await this.userBuildingsRepository.findOne({
      where: {
        user_id: userId,
        building_id: buildingId,
        link_type: UserBuildingLinkType.FAVORITE,
      },
    });
    return !!link;
  }

  async hasAssignedBuilding(userId: string, buildingId: string): Promise<boolean> {
    const link = await this.userBuildingsRepository.findOne({
      where: {
        user_id: userId,
        building_id: buildingId,
        link_type: UserBuildingLinkType.ASSIGNED,
      },
    });
    return !!link;
  }

  async assignBuildingToUser(
    userId: string,
    buildingId: string,
    linkType: UserBuildingLinkType,
  ): Promise<UserBuilding> {
    const userBuilding = this.userBuildingsRepository.create({
      user_id: userId,
      building_id: buildingId,
      link_type: linkType,
    });
    return this.userBuildingsRepository.save(userBuilding);
  }

  private async getBuildingIdsByLinkType(
    userId: string,
    linkType: UserBuildingLinkType,
  ): Promise<string[]> {
    const userBuildings = await this.userBuildingsRepository.find({
      where: { user_id: userId, link_type: linkType },
    });
    return userBuildings.map((ub) => ub.building_id);
  }
}
