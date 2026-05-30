import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserBuilding } from './user-building.entity';
import { UserRole } from './user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserBuilding)
    private userBuildingsRepository: Repository<UserBuilding>,
  ) { }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async createUser(
    email: string,
    plainPassword: string,
    role: UserRole,
    buildingIds?: string[],
  ): Promise<User> {
    const password_hash = await bcrypt.hash(plainPassword, 10);
    const user = this.usersRepository.create({
      email,
      password_hash,
      role,
    });
    const savedUser = await this.usersRepository.save(user);

    // Assign buildings if provided (only for DYREKTOR role)
    if (buildingIds && buildingIds.length > 0 && role === UserRole.DYREKTOR) {
      for (const buildingId of buildingIds) {
        await this.assignBuildingToUser(savedUser.id, buildingId);
      }
    }

    return savedUser;
  }

  async assignBuildingToUser(userId: string, buildingId: string): Promise<UserBuilding> {
    const userBuilding = this.userBuildingsRepository.create({
      user_id: userId,
      building_id: buildingId,
    });
    return this.userBuildingsRepository.save(userBuilding);
  }

  async getUserBuildings(userId: string): Promise<string[]> {
    const userBuildings = await this.userBuildingsRepository.find({
      where: { user_id: userId },
    });
    return userBuildings.map((ub) => ub.building_id);
  }
}