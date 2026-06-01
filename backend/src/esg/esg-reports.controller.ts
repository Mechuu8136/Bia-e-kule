import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { EsgReportsService } from './esg-reports.service';

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
  async findGlobal() {
    return this.reportsService.findGlobalReports();
  }

  @Get('building/:buildingId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async findByBuilding(@Param('buildingId') buildingId: string) {
    return this.reportsService.findReportsByBuilding(buildingId);
  }

  @Get('building/:buildingId/statistics')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async getStatisticsByBuilding(@Param('buildingId') buildingId: string) {
    return this.reportsService.getStatisticsByBuilding(buildingId);
  }

  @Get('global/statistics')
  @Roles(UserRole.URZEDNIK)
  async getGlobalStatistics() {
    return this.reportsService.getGlobalStatistics();
  }

  @Get(':reportId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR, UserRole.MIESZKANIEC)
  async findOne(@Param('reportId') reportId: string) {
    return this.reportsService.findReportById(reportId);
  }

  @Post()
  @Roles(UserRole.URZEDNIK)
  async create(
    @Body()
    createReportDto: {
      building_id: string | null;
      co2_reduction_kg: number;
      document_url?: string;
    },
    @Req() req: any,
  ) {
    const user = req.user as { sub: string };
    return this.reportsService.createReport(
      user.sub,
      createReportDto.building_id,
      createReportDto.co2_reduction_kg,
      createReportDto.document_url,
    );
  }
}
