import { Controller, Get, Post, Body } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AnnouncementsService } from '../announcements/announcements.service';
import { AirQualityService } from '../air-quality/air-quality.service';
import { EsgReportsService } from '../esg/esg-reports.service';
import { MunicipalityService } from '../municipality/municipality.service';
import { InitialSetupDto } from '../municipality/dto/municipality.dto';

@Controller('public')
@SkipThrottle()
export class PublicController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly airQualityService: AirQualityService,
    private readonly esgReportsService: EsgReportsService,
    private readonly municipalityService: MunicipalityService,
  ) {}

  @Get('settings')
  getMunicipalitySettings() {
    return this.municipalityService.getPublicSettings();
  }

  @Get('setup-status')
  getSetupStatus() {
    return this.municipalityService.needsSetup().then((needs_setup) => ({ needs_setup }));
  }

  @Post('setup')
  setup(@Body() dto: InitialSetupDto) {
    return this.municipalityService.initialSetup(dto);
  }

  @Get('announcements')
  getAnnouncements() {
    return this.announcementsService.findPublished();
  }

  @Get('air-quality')
  async getAirQuality() {
    const [current, trend] = await Promise.all([
      this.airQualityService.getLatest(),
      this.airQualityService.getWeeklyTrend(),
    ]);

    return { current, trend };
  }

  @Get('esg-reports')
  getGlobalEsgReports() {
    return this.esgReportsService.findPublicGlobalReports();
  }

  @Get('esg-statistics')
  getGlobalEsgStatistics() {
    return this.esgReportsService.getGlobalStatistics(true);
  }
}
