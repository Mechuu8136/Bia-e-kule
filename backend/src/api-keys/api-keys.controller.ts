import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @Roles(UserRole.URZEDNIK)
  findAll() {
    return this.apiKeysService.findAll();
  }

  @Post()
  @Roles(UserRole.URZEDNIK)
  create(@Body() dto: CreateApiKeyDto, @Req() req: any) {
    const user = req.user as { sub: string };
    return this.apiKeysService.createKey(
      dto.name,
      dto.scope,
      user.sub,
      dto.building_id,
      dto.rate_limit_per_minute,
    );
  }

  @Delete(':id')
  @Roles(UserRole.URZEDNIK)
  async remove(@Param('id') id: string) {
    await this.apiKeysService.deleteKey(id);
    return { deleted: true };
  }
}
