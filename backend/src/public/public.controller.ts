import { Controller, Get } from '@nestjs/common';
import { AnnouncementsService } from '../announcements/announcements.service';
import { AirQualityService } from '../air-quality/air-quality.service';
import { EsgReportsService } from '../esg/esg-reports.service';

@Controller('public')
export class PublicController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly airQualityService: AirQualityService,
    private readonly esgReportsService: EsgReportsService,
  ) {}

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
    return this.esgReportsService.findGlobalReports();
  }

  @Get('esg-statistics')
  getGlobalEsgStatistics() {
    return this.esgReportsService.getGlobalStatistics();
  }
}
