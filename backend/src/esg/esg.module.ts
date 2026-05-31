import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EsgReport } from './esg-report.entity';
import { EsgReportsService } from './esg-reports.service';
import { UserBuilding } from '../users/user-building.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EsgReport, UserBuilding])],
  providers: [EsgReportsService],
  exports: [EsgReportsService],
})
export class EsgModule {}
