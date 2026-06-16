import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserBuildingsDto } from './dto/update-user-buildings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './user-role.enum';

@ApiTags('Użytkownicy')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.URZEDNIK)
  @ApiOperation({ summary: 'Lista użytkowników systemu' })
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @Roles(UserRole.URZEDNIK)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(
      dto.email,
      dto.password,
      dto.role,
      dto.building_ids,
    );
  }

  @Patch(':id/buildings')
  @Roles(UserRole.URZEDNIK)
  updateBuildings(
    @Param('id') id: string,
    @Body() dto: UpdateUserBuildingsDto,
  ) {
    return this.usersService.updateUserBuildings(id, dto.building_ids ?? []);
  }

  @Delete(':id')
  @Roles(UserRole.URZEDNIK)
  delete(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
