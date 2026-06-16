import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { EsgReport } from './esg-report.entity';
import { UserBuilding } from '../users/user-building.entity';
import { UserRole } from '../users/user-role.enum';
import { UserBuildingLinkType } from '../users/user-building-link-type.enum';
import { BuildingAccessService } from '../access/building-access.service';
import { EsgReportGeneratorService } from './esg-report-generator.service';

@Injectable()
export class EsgReportsService {
  constructor(
    @InjectRepository(EsgReport)
    private reportsRepository: Repository<EsgReport>,
    @InjectRepository(UserBuilding)
    private userBuildingsRepository: Repository<UserBuilding>,
    private readonly buildingAccess: BuildingAccessService,
    private readonly reportGenerator: EsgReportGeneratorService,
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

  async generateReport(
    generatedById: string,
    buildingId: string | null,
    startDate: Date,
    endDate: Date,
    isPublic = false,
  ): Promise<EsgReport> {
    const breakdown = await this.reportGenerator.calculateCo2Reduction(
      buildingId,
      startDate,
      endDate,
    );

    const report = await this.createReport(
      generatedById,
      buildingId,
      breakdown.totalKg,
      undefined,
      isPublic,
    );

    const municipalityName = await this.reportGenerator.getMunicipalityName();
    const buildingName = await this.reportGenerator.getBuildingName(buildingId);

    await this.reportGenerator.generatePdf(
      report.id,
      breakdown,
      buildingName,
      municipalityName,
    );

    report.document_url = buildingId
      ? `/api/esg-reports/${report.id}/download`
      : isPublic
        ? `/api/public/esg-reports/${report.id}/download`
        : `/api/esg-reports/${report.id}/download`;
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
    return this.buildingAccess.hasBuildingAccess(
      buildingId,
      userId,
      userRole,
    );
  }

  async assertReportAccess(
    report: EsgReport,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    return this.buildingAccess.assertReportAccess(report, userId, userRole);
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

  async findReportByIdWithAccess(
    reportId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<EsgReport> {
    const report = await this.findReportById(reportId);
    if (!report) {
      throw new NotFoundException('Raport nie został znaleziony');
    }
    await this.assertReportAccess(report, userId, userRole);
    return report;
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
