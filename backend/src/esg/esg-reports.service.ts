import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { EsgReport } from './esg-report.entity';
import { UserBuilding } from '../users/user-building.entity';
import { UserRole } from '../users/user-role.enum';

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
  ): Promise<EsgReport> {
    const report = new EsgReport();
    report.generated_by_id = generatedById;
    report.building_id = buildingId || undefined;
    report.co2_reduction_kg = co2ReductionKg;
    report.document_url = documentUrl;
    return this.reportsRepository.save(report);
  }

  async findReportsByBuilding(buildingId: string): Promise<EsgReport[]> {
    return this.reportsRepository.find({
      where: { building_id: buildingId },
      order: { created_at: 'DESC' },
    });
  }

  async findGlobalReports(): Promise<EsgReport[]> {
    return this.reportsRepository.find({
      where: { building_id: IsNull() },
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
        where: { user_id: userId },
      });

      if (userBuildings.length === 0) {
        return [];
      }

      const buildingIds = userBuildings.map((ub) => ub.building_id);

      return this.reportsRepository.find({
        where: [
          { building_id: In(buildingIds) },
          { building_id: IsNull() },
        ],
        order: { created_at: 'DESC' },
      });
    }

    if (userRole === UserRole.MIESZKANIEC) {
      return this.findGlobalReports();
    }

    return [];
  }

  async updateReport(
    reportId: string,
    co2ReductionKg?: number,
    documentUrl?: string,
  ): Promise<EsgReport | null> {
    await this.reportsRepository.update(reportId, {
      ...(co2ReductionKg && { co2_reduction_kg: co2ReductionKg }),
      ...(documentUrl && { document_url: documentUrl }),
    });
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

  async getGlobalStatistics(): Promise<{
    totalCo2Reduction: number;
    totalReports: number;
    latestReport: EsgReport | null;
  }> {
    const reports = await this.findGlobalReports();

    return {
      totalCo2Reduction: reports.reduce((sum, r) => sum + Number(r.co2_reduction_kg), 0),
      totalReports: reports.length,
      latestReport: reports.length > 0 ? reports[0] : null,
    };
  }
}
