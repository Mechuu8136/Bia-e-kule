import { Controller, Get, Post, Param, Body, Res, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { SkipThrottle } from '@nestjs/throttler';
import { AnnouncementsService } from '../announcements/announcements.service';
import { AirQualityService } from '../air-quality/air-quality.service';
import { EsgReportsService } from '../esg/esg-reports.service';
import { EsgReportGeneratorService } from '../esg/esg-report-generator.service';
import { MunicipalityService } from '../municipality/municipality.service';
import { InitialSetupDto } from '../municipality/dto/municipality.dto';

@ApiTags('Publiczne')
@Controller('public')
@SkipThrottle()
export class PublicController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly airQualityService: AirQualityService,
    private readonly esgReportsService: EsgReportsService,
    private readonly reportGenerator: EsgReportGeneratorService,
    private readonly municipalityService: MunicipalityService,
  ) {}

  @Get('settings')
  @ApiOperation({ summary: 'Ustawienia gminy (white-label)' })
  getMunicipalitySettings() {
    return this.municipalityService.getPublicSettings();
  }

  @Get('setup-status')
  @ApiOperation({ summary: 'Czy wymagana jest pierwsza konfiguracja' })
  getSetupStatus() {
    return this.municipalityService.needsSetup().then((needs_setup) => ({ needs_setup }));
  }

  @Post('setup')
  @ApiOperation({ summary: 'Pierwsza konfiguracja gminy i konta urzędnika' })
  setup(@Body() dto: InitialSetupDto) {
    return this.municipalityService.initialSetup(dto);
  }

  @Get('announcements')
  @ApiOperation({ summary: 'Opublikowane aktualności gminy' })
  getAnnouncements() {
    return this.announcementsService.findPublished();
  }

  @Get('air-quality')
  @ApiOperation({ summary: 'Jakość powietrza — bieżący odczyt i trend 7 dni' })
  async getAirQuality() {
    const [current, trend] = await Promise.all([
      this.airQualityService.getLatest(),
      this.airQualityService.getWeeklyTrend(),
    ]);

    return { current, trend };
  }

  @Get('esg-reports')
  @ApiOperation({ summary: 'Publiczne raporty ESG gminne' })
  getGlobalEsgReports() {
    return this.esgReportsService.findPublicGlobalReports();
  }

  @Get('esg-statistics')
  @ApiOperation({ summary: 'Publiczne statystyki ESG gminne' })
  getGlobalEsgStatistics() {
    return this.esgReportsService.getGlobalStatistics(true);
  }

  @Get('esg-reports/:reportId/download')
  @ApiOperation({ summary: 'Pobierz publiczny raport ESG (PDF)' })
  async downloadPublicReport(
    @Param('reportId') reportId: string,
    @Res() res: Response,
  ) {
    const report = await this.esgReportsService.findReportById(reportId);
    if (!report || report.building_id || !report.is_public) {
      throw new NotFoundException('Raport nie jest publicznie dostępny');
    }

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
}
