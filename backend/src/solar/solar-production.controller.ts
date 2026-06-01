import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { SolarProductionService } from './solar-production.service';

@Controller('solar-production')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SolarProductionController {
  constructor(private readonly productionService: SolarProductionService) {}

  @Get(':panelId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async findByPanel(@Param('panelId') panelId: string) {
    return this.productionService.findProductionByPanel(panelId);
  }

  @Get(':panelId/range')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async findByDateRange(
    @Param('panelId') panelId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.productionService.findProductionByDateRange(
      panelId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':panelId/aggregate/day')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async aggregateByDay(
    @Param('panelId') panelId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any> {
    return this.productionService.aggregateByDay(
      panelId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':panelId/aggregate/month')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async aggregateByMonth(
    @Param('panelId') panelId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any> {
    return this.productionService.aggregateByMonth(
      panelId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':panelId/statistics')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async getStatistics(@Param('panelId') panelId: string) {
    return this.productionService.getStatistics(panelId);
  }

  @Post(':panelId')
  @Roles(UserRole.URZEDNIK)
  async create(
    @Param('panelId') panelId: string,
    @Body()
    createProductionDto: {
      timestamp: string;
      energy_produced_kwh: number;
    },
  ) {
    return this.productionService.createProduction(
      panelId,
      new Date(createProductionDto.timestamp),
      createProductionDto.energy_produced_kwh,
    );
  }
}
