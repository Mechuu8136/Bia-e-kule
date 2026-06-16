import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { EsgReportsService } from './esg-reports.service';
import { EsgReportGeneratorService } from './esg-report-generator.service';
import { CreateEsgReportDto } from './dto/create-esg-report.dto';
import { UpdateEsgReportDto } from './dto/update-esg-report.dto';
import { GenerateEsgReportDto } from './dto/generate-esg-report.dto';

@ApiTags('Raporty ESG')
@ApiBearerAuth()
@Controller('esg-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EsgReportsController {
  constructor(
    private readonly reportsService: EsgReportsService,
    private readonly reportGenerator: EsgReportGeneratorService,
  ) {}

  @Get()
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR, UserRole.MIESZKANIEC)
  @ApiOperation({ summary: 'Lista raportów ESG dostępnych dla użytkownika' })
  async findAll(@Req() req: any) {
    const user = req.user as { sub: string; role: UserRole };
    return this.reportsService.findReportsWithAccess(user.sub, user.role);
  }

  @Get('global')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR, UserRole.MIESZKANIEC)
  @ApiOperation({ summary: 'Raporty ESG gminne' })
  async findGlobal(@Req() req: any) {
    const user = req.user as { role: UserRole };
    if (user.role === UserRole.URZEDNIK) {
      return this.reportsService.findGlobalReports();
    }
    return this.reportsService.findPublicGlobalReports();
  }

  @Get('building/:buildingId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR, UserRole.MIESZKANIEC)
  @ApiOperation({ summary: 'Raporty ESG dla budynku' })
  @ApiResponse({ status: 403, description: 'Brak dostępu do budynku' })
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
  @ApiOperation({ summary: 'Statystyki ESG dla budynku' })
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
  @ApiOperation({ summary: 'Statystyki ESG gminne' })
  async getGlobalStatistics(@Req() req: any) {
    const user = req.user as { role: UserRole };
    const publicOnly = user.role !== UserRole.URZEDNIK;
    return this.reportsService.getGlobalStatistics(publicOnly);
  }

  @Post('generate')
  @Roles(UserRole.URZEDNIK)
  @ApiOperation({
    summary: 'Automatyczne wygenerowanie raportu CO2 z danych liczników i OZE',
  })
  async generate(@Body() dto: GenerateEsgReportDto, @Req() req: any) {
    const user = req.user as { sub: string };
    const buildingId = dto.building_id ?? null;
    return this.reportsService.generateReport(
      user.sub,
      buildingId,
      new Date(dto.start_date),
      new Date(dto.end_date),
      dto.is_public ?? false,
    );
  }

  @Get(':reportId/download')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR, UserRole.MIESZKANIEC)
  @ApiOperation({ summary: 'Pobierz plik PDF raportu ESG' })
  async download(
    @Param('reportId') reportId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const user = req.user as { sub: string; role: UserRole };
    await this.reportsService.findReportByIdWithAccess(
      reportId,
      user.sub,
      user.role,
    );

    const filePath = this.reportGenerator.getReportFilePath(reportId);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Plik raportu nie został znaleziony');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="raport-esg-${reportId}.pdf"`,
    );
    createReadStream(filePath).pipe(res);
  }

  @Get(':reportId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR, UserRole.MIESZKANIEC)
  @ApiOperation({ summary: 'Szczegóły raportu ESG' })
  @ApiResponse({ status: 403, description: 'Brak dostępu do raportu' })
  async findOne(@Param('reportId') reportId: string, @Req() req: any) {
    const user = req.user as { sub: string; role: UserRole };
    return this.reportsService.findReportByIdWithAccess(
      reportId,
      user.sub,
      user.role,
    );
  }

  @Delete(':reportId')
  @Roles(UserRole.URZEDNIK)
  @ApiOperation({ summary: 'Usuń raport ESG' })
  async remove(@Param('reportId') reportId: string) {
    await this.reportsService.deleteReport(reportId);
    return { deleted: true };
  }

  @Post()
  @Roles(UserRole.URZEDNIK)
  @ApiOperation({ summary: 'Ręczne utworzenie wpisu raportu ESG' })
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
  @ApiOperation({ summary: 'Aktualizuj raport ESG' })
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
