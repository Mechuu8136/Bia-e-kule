import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { EsgReport } from './esg-report.entity';
import { UserBuilding } from '../users/user-building.entity';
import { UserRole } from '../users/user-role.enum';
import { UserBuildingLinkType } from '../users/user-building-link-type.enum';

@Injectable()
export class EsgReportsService {
  constructor(
    @InjectRepository(EsgReport)
    private reportsRepository: Repository<EsgReport>,
    @InjectRepository(UserBuilding)
    private userBuildingsRepository: Repository<UserBuilding>,
  ) {}

  async createReport(
    generatedById: string,
    buildingId: string | null,
    co2ReductionKg: number,
    documentUrl?: string,
    isPublic = false,
  ): Promise<EsgReport> {
    const report = new EsgReport();
    report.generated_by_id = generatedById;
    report.building_id = buildingId || undefined;
    report.co2_reduction_kg = co2ReductionKg;
    report.document_url = documentUrl;
    report.is_public = buildingId ? false : isPublic;
    return this.reportsRepository.save(report);
  }

  async findReportsByBuilding(buildingId: string): Promise<EsgReport[]> {
    return this.reportsRepository.find({
      where: { building_id: buildingId },
      order: { created_at: 'DESC' },
    });
  }

  async hasBuildingAccess(
    buildingId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<boolean> {
    if (userRole === UserRole.URZEDNIK) return true;

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

  async findGlobalReports(): Promise<EsgReport[]> {
    return this.reportsRepository.find({
      where: { building_id: IsNull() },
      order: { created_at: 'DESC' },
    });
  }

  async findPublicGlobalReports(): Promise<EsgReport[]> {
    return this.reportsRepository.find({
      where: { building_id: IsNull(), is_public: true },
      order: { created_at: 'DESC' },
    });
  }

  async findReportById(reportId: string): Promise<EsgReport | null> {
    return this.reportsRepository.findOne({
      where: { id: reportId },
    });
  }

  async findReportsWithAccess(
    userId: string,
    userRole: UserRole,
  ): Promise<EsgReport[]> {
    if (userRole === UserRole.URZEDNIK) {
      return this.reportsRepository.find({
        order: { created_at: 'DESC' },
      });
    }

    if (userRole === UserRole.DYREKTOR) {
      const userBuildings = await this.userBuildingsRepository.find({
        where: { user_id: userId, link_type: UserBuildingLinkType.ASSIGNED },
      });

      if (userBuildings.length === 0) {
        return [];
      }

      const buildingIds = userBuildings.map((ub) => ub.building_id);

      return this.reportsRepository.find({
        where: [
          { building_id: In(buildingIds) },
          { building_id: IsNull(), is_public: true },
        ],
        order: { created_at: 'DESC' },
      });
    }

    if (userRole === UserRole.MIESZKANIEC) {
      const userBuildings = await this.userBuildingsRepository.find({
        where: { user_id: userId, link_type: UserBuildingLinkType.FAVORITE },
      });

      if (userBuildings.length === 0) {
        return this.findPublicGlobalReports();
      }

      const buildingIds = userBuildings.map((ub) => ub.building_id);

      return this.reportsRepository.find({
        where: [
          { building_id: In(buildingIds) },
          { building_id: IsNull(), is_public: true },
        ],
        order: { created_at: 'DESC' },
      });
    }

    return [];
  }

  async updateReport(
    reportId: string,
    updates: {
      co2ReductionKg?: number;
      documentUrl?: string;
      isPublic?: boolean;
    },
  ): Promise<EsgReport | null> {
    const report = await this.findReportById(reportId);
    if (!report) return null;

    const patch: Partial<EsgReport> = {};

    if (updates.co2ReductionKg !== undefined) {
      patch.co2_reduction_kg = updates.co2ReductionKg;
    }
    if (updates.documentUrl !== undefined) {
      patch.document_url = updates.documentUrl;
    }
    if (updates.isPublic !== undefined) {
      patch.is_public = report.building_id ? false : updates.isPublic;
    }

    if (Object.keys(patch).length > 0) {
      await this.reportsRepository.update(reportId, patch);
    }

    return this.findReportById(reportId);
  }

  async deleteReport(reportId: string): Promise<void> {
    await this.reportsRepository.delete(reportId);
  }

  async getStatisticsByBuilding(buildingId: string): Promise<{
    totalReports: number;
    totalCo2Reduction: number;
    latestReport: EsgReport | null;
  }> {
    const reports = await this.findReportsByBuilding(buildingId);

    return {
      totalReports: reports.length,
      totalCo2Reduction: reports.reduce((sum, r) => sum + Number(r.co2_reduction_kg), 0),
      latestReport: reports.length > 0 ? reports[0] : null,
    };
  }

  async getGlobalStatistics(publicOnly = false): Promise<{
    totalCo2Reduction: number;
    totalReports: number;
    latestReport: EsgReport | null;
  }> {
    const reports = publicOnly
      ? await this.findPublicGlobalReports()
      : await this.findGlobalReports();

    return {
      totalCo2Reduction: reports.reduce((sum, r) => sum + Number(r.co2_reduction_kg), 0),
      totalReports: reports.length,
      latestReport: reports.length > 0 ? reports[0] : null,
    };
  }
}
