import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Building } from './building.entity';
import { BuildingType } from './building-type.enum';
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

  async findByExternalCode(externalCode: string): Promise<Building | null> {
    return this.buildingsRepository.findOne({ where: { external_code: externalCode } });
  }

  async upsertByExternalCode(
    externalCode: string,
    name: string,
    address: string,
    type: BuildingType,
  ): Promise<Building> {
    const existing = await this.findByExternalCode(externalCode);
    if (existing) {
      existing.name = name;
      existing.address = address;
      existing.type = type;
      return this.buildingsRepository.save(existing);
    }

    const building = this.buildingsRepository.create({
      external_code: externalCode,
      name,
      address,
      type,
    });
    return this.buildingsRepository.save(building);
  }
}
