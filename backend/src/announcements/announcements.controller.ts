import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @Roles(UserRole.URZEDNIK)
  findAll() {
    return this.announcementsService.findAll();
  }

  @Post()
  @Roles(UserRole.URZEDNIK)
  create(
    @Body()
    dto: { title: string; body: string; is_published?: boolean },
  ) {
    return this.announcementsService.create(dto.title, dto.body, dto.is_published ?? true);
  }

  @Delete(':id')
  @Roles(UserRole.URZEDNIK)
  async remove(@Param('id') id: string) {
    await this.announcementsService.delete(id);
    return { deleted: true };
  }
}
