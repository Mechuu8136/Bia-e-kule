import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { MeterReadingsService } from './meter-readings.service';

@Controller('meter-readings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeterReadingsController {
  constructor(private readonly readingsService: MeterReadingsService) {}

  @Get(':meterId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async findByMeter(@Param('meterId') meterId: string) {
    return this.readingsService.findReadingsByMeter(meterId);
  }

  @Get(':meterId/range')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async findByDateRange(
    @Param('meterId') meterId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.readingsService.findReadingsByDateRange(
      meterId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':meterId/aggregate/day')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async aggregateByDay(
    @Param('meterId') meterId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any> {
    return this.readingsService.aggregateByDay(
      meterId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':meterId/aggregate/hour')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async aggregateByHour(
    @Param('meterId') meterId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any> {
    return this.readingsService.aggregateByHour(
      meterId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':meterId/aggregate/month')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async aggregateByMonth(
    @Param('meterId') meterId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any> {
    return this.readingsService.aggregateByMonth(
      meterId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':meterId/statistics')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async getStatistics(@Param('meterId') meterId: string) {
    return this.readingsService.getStatistics(meterId);
  }

  @Post(':meterId')
  @Roles(UserRole.URZEDNIK)
  async create(
    @Param('meterId') meterId: string,
    @Body()
    createReadingDto: {
      timestamp: string;
      value: number;
    },
  ) {
    return this.readingsService.createReading(
      meterId,
      new Date(createReadingDto.timestamp),
      createReadingDto.value,
    );
  }
}
