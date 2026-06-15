import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { SolarPanelsService } from './solar-panels.service';

@Controller('solar-panels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SolarPanelsController {
  constructor(private readonly panelsService: SolarPanelsService) {}

  @Get()
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async findAll(@Req() req: any) {
    const user = req.user as { sub: string; role: UserRole };
    return this.panelsService.findAllPanelsWithAccess(user.sub, user.role);
  }

  @Get('building/:buildingId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async findByBuilding(@Param('buildingId') buildingId: string, @Req() req: any) {
    const user = req.user as { sub: string; role: UserRole };
    return this.panelsService.findPanelsByBuilding(buildingId, user.sub, user.role);
  }

  @Get(':panelId')
  @Roles(UserRole.URZEDNIK, UserRole.DYREKTOR)
  async findOne(@Param('panelId') panelId: string) {
    return this.panelsService.findPanelById(panelId);
  }

  @Post()
  @Roles(UserRole.URZEDNIK)
  async create(
    @Body()
    createPanelDto: {
      building_id: string;
      capacity_kwp: number;
      installation_date: string;
      serial_number: string;
    },
  ) {
    return this.panelsService.createPanel(
      createPanelDto.building_id,
      createPanelDto.capacity_kwp,
      new Date(createPanelDto.installation_date),
      createPanelDto.serial_number,
    );
  }
}
