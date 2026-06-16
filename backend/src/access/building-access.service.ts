import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBuilding } from '../users/user-building.entity';
import { UserRole } from '../users/user-role.enum';
import { UserBuildingLinkType } from '../users/user-building-link-type.enum';
import { Meter } from '../meters/meter.entity';
import { SolarPanel } from '../solar/solar-panel.entity';
import { EsgReport } from '../esg/esg-report.entity';

@Injectable()
export class BuildingAccessService {
  constructor(
    @InjectRepository(UserBuilding)
    private readonly userBuildingsRepository: Repository<UserBuilding>,
    @InjectRepository(Meter)
    private readonly metersRepository: Repository<Meter>,
    @InjectRepository(SolarPanel)
    private readonly panelsRepository: Repository<SolarPanel>,
  ) {}

  async hasBuildingAccess(
    buildingId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<boolean> {
    if (userRole === UserRole.URZEDNIK) {
      return true;
    }

    if (userRole === UserRole.DYREKTOR) {
      const userBuildings = await this.userBuildingsRepository.find({
        where: { user_id: userId, link_type: UserBuildingLinkType.ASSIGNED },
      });
      return userBuildings.some((ub) => ub.building_id === buildingId);
    }

    if (userRole === UserRole.MIESZKANIEC) {
      const favorite = await this.userBuildingsRepository.findOne({
        where: {
          user_id: userId,
          building_id: buildingId,
          link_type: UserBuildingLinkType.FAVORITE,
        },
      });
      return !!favorite;
    }

    return false;
  }

  async assertBuildingAccess(
    buildingId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const hasAccess = await this.hasBuildingAccess(
      buildingId,
      userId,
      userRole,
    );
    if (!hasAccess) {
      throw new ForbiddenException('Brak dostępu do tego budynku');
    }
  }

  async assertMeterAccess(
    meterId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<Meter> {
    const meter = await this.metersRepository.findOne({
      where: { id: meterId },
    });
    if (!meter) {
      throw new NotFoundException('Licznik nie został znaleziony');
    }
    await this.assertBuildingAccess(meter.building_id, userId, userRole);
    return meter;
  }

  async assertPanelAccess(
    panelId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<SolarPanel> {
    const panel = await this.panelsRepository.findOne({
      where: { id: panelId },
    });
    if (!panel) {
      throw new NotFoundException('Panel fotowoltaiczny nie został znaleziony');
    }
    await this.assertBuildingAccess(panel.building_id, userId, userRole);
    return panel;
  }

  async assertReportAccess(
    report: EsgReport,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    if (userRole === UserRole.URZEDNIK) {
      return;
    }

    if (!report.building_id) {
      if (!report.is_public) {
        throw new ForbiddenException('Brak dostępu do tego raportu');
      }
      return;
    }

    await this.assertBuildingAccess(report.building_id, userId, userRole);
  }
}
