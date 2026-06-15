import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Building } from './building.entity';
import { UserBuilding } from '../users/user-building.entity';
import { UserRole } from '../users/user-role.enum';
import { UserBuildingLinkType } from '../users/user-building-link-type.enum';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building)
    private buildingsRepository: Repository<Building>,
    @InjectRepository(UserBuilding)
    private userBuildingsRepository: Repository<UserBuilding>,
  ) {}

  async findAll(userId: string, userRole: UserRole): Promise<Building[]> {
    if (userRole === UserRole.URZEDNIK) {
      return this.buildingsRepository.find({ order: { name: 'ASC' } });
    }

    if (userRole === UserRole.DYREKTOR) {
      return this.findAssignedBuildings(userId);
    }

    if (userRole === UserRole.MIESZKANIEC) {
      return this.findFavorites(userId);
    }

    return [];
  }

  async findAssignedBuildings(userId: string): Promise<Building[]> {
    const userBuildings = await this.userBuildingsRepository.find({
      where: { user_id: userId, link_type: UserBuildingLinkType.ASSIGNED },
    });

    if (userBuildings.length === 0) {
      return [];
    }

    const buildingIds = userBuildings.map((ub) => ub.building_id);
    return this.buildingsRepository.find({
      where: { id: In(buildingIds) },
      order: { name: 'ASC' },
    });
  }

  async findFavorites(userId: string): Promise<Building[]> {
    const userBuildings = await this.userBuildingsRepository.find({
      where: { user_id: userId, link_type: UserBuildingLinkType.FAVORITE },
    });

    if (userBuildings.length === 0) {
      return [];
    }

    const buildingIds = userBuildings.map((ub) => ub.building_id);
    return this.buildingsRepository.find({
      where: { id: In(buildingIds) },
      order: { name: 'ASC' },
    });
  }

  async findCatalog(): Promise<Building[]> {
    return this.buildingsRepository.find({ order: { name: 'ASC' } });
  }
}
