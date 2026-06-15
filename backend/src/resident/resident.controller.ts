import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { UsersService } from '../users/users.service';
import { BuildingsService } from '../buildings/buildings.service';
import { BuildingInsightsService } from './building-insights.service';

@Controller('resident')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentController {
  constructor(
    private readonly usersService: UsersService,
    private readonly buildingsService: BuildingsService,
    private readonly insightsService: BuildingInsightsService,
  ) {}

  @Get('favorites')
  @Roles(UserRole.MIESZKANIEC)
  getFavorites(@Req() req: any) {
    const user = req.user as { sub: string };
    return this.buildingsService.findFavorites(user.sub);
  }

  @Get('buildings/catalog')
  @Roles(UserRole.MIESZKANIEC)
  getCatalog() {
    return this.buildingsService.findCatalog();
  }

  @Post('favorites/:buildingId')
  @Roles(UserRole.MIESZKANIEC)
  async addFavorite(@Param('buildingId') buildingId: string, @Req() req: any) {
    const user = req.user as { sub: string };
    await this.usersService.addFavoriteBuilding(user.sub, buildingId);
    return { success: true };
  }

  @Delete('favorites/:buildingId')
  @Roles(UserRole.MIESZKANIEC)
  async removeFavorite(@Param('buildingId') buildingId: string, @Req() req: any) {
    const user = req.user as { sub: string };
    await this.usersService.removeFavoriteBuilding(user.sub, buildingId);
    return { success: true };
  }

  @Get('buildings/:buildingId/summary')
  @Roles(UserRole.MIESZKANIEC)
  async getBuildingSummary(
    @Param('buildingId') buildingId: string,
    @Req() req: any,
  ) {
    const user = req.user as { sub: string };
    const hasAccess = await this.usersService.hasFavoriteBuilding(user.sub, buildingId);
    if (!hasAccess) {
      throw new ForbiddenException('Dodaj budynek do ulubionych, aby zobaczyć podgląd');
    }
    return this.insightsService.getBuildingSummary(buildingId);
  }
}
