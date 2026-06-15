import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { EsgReportsService } from './esg-reports.service';
import { CreateEsgReportDto } from './dto/create-esg-report.dto';
import { UpdateEsgReportDto } from './dto/update-esg-report.dto';

@Controller('esg-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EsgReportsController {
  constructor(private readonly reportsService: EsgReportsService) {}

  @Get()
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR, UserRole.MIESZKANIEC)
  async findAll(@Req() req: any) {
    const user = req.user as { sub: string; role: UserRole };
    return this.reportsService.findReportsWithAccess(user.sub, user.role);
  }

  @Get('global')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR, UserRole.MIESZKANIEC)
  async findGlobal(@Req() req: any) {
    const user = req.user as { role: UserRole };
    if (user.role === UserRole.URZEDNIK) {
      return this.reportsService.findGlobalReports();
    }
    return this.reportsService.findPublicGlobalReports();
  }

  @Get('building/:buildingId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR, UserRole.MIESZKANIEC)
  async findByBuilding(@Param('buildingId') buildingId: string, @Req() req: any) {
    const user = req.user as { sub: string; role: UserRole };
    const hasAccess = await this.reportsService.hasBuildingAccess(
      buildingId,
      user.sub,
      user.role,
    );
    if (!hasAccess) {
      throw new ForbiddenException('Brak dostępu do raportów tego budynku');
    }
    return this.reportsService.findReportsByBuilding(buildingId);
  }

  @Get('building/:buildingId/statistics')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async getStatisticsByBuilding(@Param('buildingId') buildingId: string, @Req() req: any) {
    const user = req.user as { sub: string; role: UserRole };
    const hasAccess = await this.reportsService.hasBuildingAccess(
      buildingId,
      user.sub,
      user.role,
    );
    if (!hasAccess) {
      throw new ForbiddenException('Brak dostępu do statystyk tego budynku');
    }
    return this.reportsService.getStatisticsByBuilding(buildingId);
  }

  @Get('global/statistics')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR, UserRole.MIESZKANIEC)
  async getGlobalStatistics(@Req() req: any) {
    const user = req.user as { role: UserRole };
    const publicOnly = user.role !== UserRole.URZEDNIK;
    return this.reportsService.getGlobalStatistics(publicOnly);
  }

  @Get(':reportId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR, UserRole.MIESZKANIEC)
  async findOne(@Param('reportId') reportId: string) {
    return this.reportsService.findReportById(reportId);
  }

  @Delete(':reportId')
  @Roles(UserRole.URZEDNIK)
  async remove(@Param('reportId') reportId: string) {
    await this.reportsService.deleteReport(reportId);
    return { deleted: true };
  }

  @Post()
  @Roles(UserRole.URZEDNIK)
  async create(@Body() createReportDto: CreateEsgReportDto, @Req() req: any) {
    const user = req.user as { sub: string };
    const buildingId = createReportDto.building_id ?? null;
    return this.reportsService.createReport(
      user.sub,
      buildingId,
      createReportDto.co2_reduction_kg,
      createReportDto.document_url,
      createReportDto.is_public ?? false,
    );
  }

  @Patch(':reportId')
  @Roles(UserRole.URZEDNIK)
  async update(@Param('reportId') reportId: string, @Body() dto: UpdateEsgReportDto) {
    const updated = await this.reportsService.updateReport(reportId, {
      co2ReductionKg: dto.co2_reduction_kg,
      documentUrl: dto.document_url,
      isPublic: dto.is_public,
    });
    if (!updated) {
      throw new NotFoundException('Raport nie został znaleziony');
    }
    return updated;
  }
}
