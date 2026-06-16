import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Meter } from './meter.entity';
import { MeterType } from './meter-type.enum';
import { UserBuilding } from '../users/user-building.entity';
import { UserRole } from '../users/user-role.enum';
import { UserBuildingLinkType } from '../users/user-building-link-type.enum';
import { BuildingAccessService } from '../access/building-access.service';

@Injectable()
export class MetersService {
  constructor(
    @InjectRepository(Meter)
    private metersRepository: Repository<Meter>,
    @InjectRepository(UserBuilding)
    private userBuildingsRepository: Repository<UserBuilding>,
    private readonly buildingAccess: BuildingAccessService,
  ) {}

  async createMeter(
    buildingId: string,
    type: MeterType,
    serialNumber: string,
    unit: string,
  ): Promise<Meter> {
    const meter = this.metersRepository.create({
      building_id: buildingId,
      type,
      serial_number: serialNumber,
      unit,
    });
    return this.metersRepository.save(meter);
  }

  async findMetersByBuilding(
    buildingId: string,
    userId?: string,
    userRole?: UserRole,
  ): Promise<Meter[]> {
    if (userId && userRole) {
      await this.buildingAccess.assertBuildingAccess(
        buildingId,
        userId,
        userRole,
      );
    }

    return this.metersRepository.find({
      where: { building_id: buildingId },
    });
  }

  async findMeterById(
    meterId: string,
    userId?: string,
    userRole?: UserRole,
  ): Promise<Meter | null> {
    if (userId && userRole) {
      return this.buildingAccess.assertMeterAccess(meterId, userId, userRole);
    }

    return this.metersRepository.findOne({
      where: { id: meterId },
    });
  }

  async findAllMetersWithAccess(
    userId: string,
    userRole: UserRole,
  ): Promise<Meter[]> {
    if (userRole === UserRole.URZEDNIK) {
      return this.metersRepository.find();
    }

    if (userRole === UserRole.DYREKTOR) {
      const userBuildings = await this.userBuildingsRepository.find({
        where: { user_id: userId, link_type: UserBuildingLinkType.ASSIGNED },
      });

      if (userBuildings.length === 0) {
        return [];
      }

      const buildingIds = userBuildings.map((ub) => ub.building_id);
      return this.metersRepository.find({
        where: { building_id: In(buildingIds) },
      });
    }

    return [];
  }

  async updateMeter(
    meterId: string,
    type?: MeterType,
    serialNumber?: string,
    unit?: string,
  ): Promise<Meter | null> {
    await this.metersRepository.update(meterId, {
      ...(type && { type }),
      ...(serialNumber && { serial_number: serialNumber }),
      ...(unit && { unit }),
    });
    return this.findMeterById(meterId);
  }

  async deleteMeter(meterId: string): Promise<void> {
    await this.metersRepository.delete(meterId);
  }
}
