import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SolarPanel } from './solar-panel.entity';
import { UserBuilding } from '../users/user-building.entity';
import { UserRole } from '../users/user-role.enum';
import { UserBuildingLinkType } from '../users/user-building-link-type.enum';
import { BuildingAccessService } from '../access/building-access.service';

@Injectable()
export class SolarPanelsService {
  constructor(
    @InjectRepository(SolarPanel)
    private panelsRepository: Repository<SolarPanel>,
    @InjectRepository(UserBuilding)
    private userBuildingsRepository: Repository<UserBuilding>,
    private readonly buildingAccess: BuildingAccessService,
  ) {}

  async createPanel(
    buildingId: string,
    capacityKwp: number,
    installationDate: Date,
    serialNumber: string,
  ): Promise<SolarPanel> {
    const panel = this.panelsRepository.create({
      building_id: buildingId,
      capacity_kwp: capacityKwp,
      installation_date: installationDate,
      serial_number: serialNumber,
    });
    return this.panelsRepository.save(panel);
  }

  async findPanelsByBuilding(
    buildingId: string,
    userId?: string,
    userRole?: UserRole,
  ): Promise<SolarPanel[]> {
    if (userId && userRole) {
      await this.buildingAccess.assertBuildingAccess(
        buildingId,
        userId,
        userRole,
      );
    }

    return this.panelsRepository.find({
      where: { building_id: buildingId },
    });
  }

  async findPanelById(
    panelId: string,
    userId?: string,
    userRole?: UserRole,
  ): Promise<SolarPanel | null> {
    if (userId && userRole) {
      return this.buildingAccess.assertPanelAccess(panelId, userId, userRole);
    }

    return this.panelsRepository.findOne({
      where: { id: panelId },
    });
  }

  async findAllPanelsWithAccess(
    userId: string,
    userRole: UserRole,
  ): Promise<SolarPanel[]> {
    if (userRole === UserRole.URZEDNIK) {
      return this.panelsRepository.find();
    }

    if (userRole === UserRole.DYREKTOR) {
      const userBuildings = await this.userBuildingsRepository.find({
        where: { user_id: userId, link_type: UserBuildingLinkType.ASSIGNED },
      });

      if (userBuildings.length === 0) {
        return [];
      }

      const buildingIds = userBuildings.map((ub) => ub.building_id);
      return this.panelsRepository.find({
        where: { building_id: In(buildingIds) },
      });
    }

    return [];
  }

  async updatePanel(
    panelId: string,
    capacityKwp?: number,
    installationDate?: Date,
  ): Promise<SolarPanel | null> {
    await this.panelsRepository.update(panelId, {
      ...(capacityKwp && { capacity_kwp: capacityKwp }),
      ...(installationDate && { installation_date: installationDate }),
    });
    return this.findPanelById(panelId);
  }

  async deletePanel(panelId: string): Promise<void> {
    await this.panelsRepository.delete(panelId);
  }
}
