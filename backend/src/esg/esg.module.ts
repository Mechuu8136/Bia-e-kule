import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EsgReport } from './esg-report.entity';
import { EsgReportsService } from './esg-reports.service';
import { EsgReportsController } from './esg-reports.controller';
import { UserBuilding } from '../users/user-building.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EsgReport, UserBuilding])],
  providers: [EsgReportsService],
  controllers: [EsgReportsController],
  exports: [EsgReportsService],
})
export class EsgModule {}
