import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Building } from './building.entity';
import { UserBuilding } from '../users/user-building.entity';
import { UserRole } from '../users/user-role.enum';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building)
    private buildingsRepository: Repository<Building>,
    @InjectRepository(UserBuilding)
    private userBuildingsRepository: Repository<UserBuilding>,
  ) { }

  async findAll(userId: string, userRole: UserRole): Promise<Building[]> {
    if (userRole === UserRole.URZEDNIK) {
      // URZEDNIK sees all buildings
      return this.buildingsRepository.find();
    }

    if (userRole === UserRole.DYREKTOR) {
      // DYREKTOR sees only buildings they manage
      const userBuildings = await this.userBuildingsRepository.find({
        where: { user_id: userId },
      });

      if (userBuildings.length === 0) {
        return [];
      }

      const buildingIds = userBuildings.map((ub) => ub.building_id);
      return this.buildingsRepository.find({
        where: { id: In(buildingIds) },
      });
    }

    // Other roles (MIESZKANIEC, GOSC) have no access
    return [];
  }
}