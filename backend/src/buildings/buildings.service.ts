import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from './building.entity';
import { UserRole } from '../users/user-role.enum';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building)
    private buildingsRepository: Repository<Building>,
  ) {}

  findAll(userId: string, userRole: UserRole): Promise<Building[]> {
    if (userRole === UserRole.URZEDNIK) {
      return this.buildingsRepository.find();
    }
    return this.buildingsRepository.find({
      where: { manager_id: userId },
    });
  }
}