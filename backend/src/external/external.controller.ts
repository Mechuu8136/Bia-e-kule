import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiKeyGuard } from '../api-keys/api-key.guard';
import { ApiKeyContext } from '../api-keys/api-key-context.interface';
import { ExternalIngestionService } from './external-ingestion.service';
import { ExternalProvisioningService } from './external-provisioning.service';
import { ExternalQueryService } from './external-query.service';
import { IngestMeterReadingsDto } from './dto/ingest-meter-readings.dto';
import { IngestSolarProductionDto } from './dto/ingest-solar-production.dto';
import { ExternalProvisionDto } from './dto/external-provision.dto';
import {
  IngestAirQualityDto,
  IngestAnnouncementsDto,
} from './dto/ingest-air-quality.dto';

@Controller('external')
@UseGuards(ApiKeyGuard)
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class ExternalController {
  constructor(
    private readonly ingestionService: ExternalIngestionService,
    private readonly provisioningService: ExternalProvisioningService,
    private readonly queryService: ExternalQueryService,
  ) {}

  @Get('status')
  getStatus() {
    return this.queryService.getStatus();
  }

  @Get('buildings')
  listBuildings() {
    return this.queryService.listBuildings();
  }

  @Get('meters')
  listMeters() {
    return this.queryService.listMeters();
  }

  @Get('users')
  listUsers() {
    return this.queryService.listUsers();
  }

  @Post('provision')
  provision(@Body() dto: ExternalProvisionDto) {
    return this.provisioningService.provision(dto);
  }

  @Post('meter-readings')
  ingestMeterReadings(
    @Body() dto: IngestMeterReadingsDto,
    @Req() req: { apiKey: ApiKeyContext },
  ) {
    return this.ingestionService.ingestMeterReadings(req.apiKey, dto.readings);
  }

  @Post('solar-production')
  ingestSolarProduction(
    @Body() dto: IngestSolarProductionDto,
    @Req() req: { apiKey: ApiKeyContext },
  ) {
    return this.ingestionService.ingestSolarProduction(req.apiKey, dto.production);
  }

  @Post('air-quality')
  ingestAirQuality(@Body() dto: IngestAirQualityDto) {
    return this.ingestionService.ingestAirQuality(dto.readings);
  }

  @Post('announcements')
  ingestAnnouncements(@Body() dto: IngestAnnouncementsDto) {
    return this.ingestionService.ingestAnnouncements(dto.announcements);
  }
}
