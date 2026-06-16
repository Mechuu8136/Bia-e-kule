import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { MeterReadingsService } from './meter-readings.service';

@ApiTags('Odczyty liczników')
@ApiBearerAuth()
@Controller('meter-readings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeterReadingsController {
  constructor(private readonly readingsService: MeterReadingsService) {}

  @Get(':meterId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  @ApiOperation({ summary: 'Wszystkie odczyty licznika' })
  @ApiResponse({ status: 403, description: 'Brak dostępu do licznika' })
  async findByMeter(@Param('meterId') meterId: string, @Req() req: any) {
    const user = req.user as { sub: string; role: UserRole };
    return this.readingsService.findReadingsByMeter(meterId, user.sub, user.role);
  }

  @Get(':meterId/range')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  @ApiOperation({ summary: 'Odczyty licznika w zakresie dat' })
  async findByDateRange(
    @Param('meterId') meterId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ) {
    const user = req.user as { sub: string; role: UserRole };
    return this.readingsService.findReadingsByDateRange(
      meterId,
      new Date(startDate),
      new Date(endDate),
      user.sub,
      user.role,
    );
  }

  @Get(':meterId/aggregate/day')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  @ApiOperation({ summary: 'Agregacja dzienna odczytów' })
  async aggregateByDay(
    @Param('meterId') meterId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ): Promise<any> {
    const user = req.user as { sub: string; role: UserRole };
    return this.readingsService.aggregateByDay(
      meterId,
      new Date(startDate),
      new Date(endDate),
      user.sub,
      user.role,
    );
  }

  @Get(':meterId/aggregate/hour')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  @ApiOperation({ summary: 'Agregacja godzinowa odczytów' })
  async aggregateByHour(
    @Param('meterId') meterId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ): Promise<any> {
    const user = req.user as { sub: string; role: UserRole };
    return this.readingsService.aggregateByHour(
      meterId,
      new Date(startDate),
      new Date(endDate),
      user.sub,
      user.role,
    );
  }

  @Get(':meterId/aggregate/month')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  @ApiOperation({ summary: 'Agregacja miesięczna odczytów' })
  async aggregateByMonth(
    @Param('meterId') meterId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ): Promise<any> {
    const user = req.user as { sub: string; role: UserRole };
    return this.readingsService.aggregateByMonth(
      meterId,
      new Date(startDate),
      new Date(endDate),
      user.sub,
      user.role,
    );
  }

  @Get(':meterId/statistics')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  @ApiOperation({ summary: 'Statystyki odczytów licznika' })
  async getStatistics(@Param('meterId') meterId: string, @Req() req: any) {
    const user = req.user as { sub: string; role: UserRole };
    return this.readingsService.getStatistics(meterId, user.sub, user.role);
  }

  @Post(':meterId')
  @Roles(UserRole.URZEDNIK)
  @ApiOperation({ summary: 'Dodaj odczyt licznika' })
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
