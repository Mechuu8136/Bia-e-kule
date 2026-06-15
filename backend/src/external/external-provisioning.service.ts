import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuildingsService } from '../buildings/buildings.service';
import { MetersService } from '../meters/meters.service';
import { SolarPanelsService } from '../solar/solar-panels.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user-role.enum';
import { Meter } from '../meters/meter.entity';
import { SolarPanel } from '../solar/solar-panel.entity';
import {
  ExternalProvisionDto,
  ProvisionBuildingDto,
  ProvisionMeterDto,
  ProvisionSolarPanelDto,
  ProvisionUserDto,
} from './dto/external-provision.dto';

export interface ProvisionResult {
  buildings: { externalCode: string; id: string; created: boolean }[];
  meters: { serialNumber: string; id: string; created: boolean }[];
  solarPanels: { serialNumber: string; id: string; created: boolean }[];
  users: { email: string; id: string; role: string; created: boolean }[];
  errors: string[];
}

@Injectable()
export class ExternalProvisioningService {
  constructor(
    private readonly buildingsService: BuildingsService,
    private readonly metersService: MetersService,
    private readonly solarPanelsService: SolarPanelsService,
    private readonly usersService: UsersService,
    @InjectRepository(Meter)
    private readonly metersRepository: Repository<Meter>,
    @InjectRepository(SolarPanel)
    private readonly panelsRepository: Repository<SolarPanel>,
  ) {}

  async provision(dto: ExternalProvisionDto): Promise<ProvisionResult> {
    const result: ProvisionResult = {
      buildings: [],
      meters: [],
      solarPanels: [],
      users: [],
      errors: [],
    };

    for (const building of dto.buildings ?? []) {
      try {
        result.buildings.push(await this.upsertBuilding(building));
      } catch (err) {
        result.errors.push(`Budynek ${building.externalCode}: ${(err as Error).message}`);
      }
    }

    for (const meter of dto.meters ?? []) {
      try {
        result.meters.push(await this.upsertMeter(meter));
      } catch (err) {
        result.errors.push(`Licznik ${meter.serialNumber}: ${(err as Error).message}`);
      }
    }

    for (const panel of dto.solarPanels ?? []) {
      try {
        result.solarPanels.push(await this.upsertSolarPanel(panel));
      } catch (err) {
        result.errors.push(`Panel ${panel.serialNumber}: ${(err as Error).message}`);
      }
    }

    for (const user of dto.users ?? []) {
      try {
        result.users.push(await this.upsertUser(user));
      } catch (err) {
        result.errors.push(`Użytkownik ${user.email}: ${(err as Error).message}`);
      }
    }

    return result;
  }

  private async upsertBuilding(dto: ProvisionBuildingDto) {
    const existing = await this.buildingsService.findByExternalCode(dto.externalCode);
    const saved = await this.buildingsService.upsertByExternalCode(
      dto.externalCode,
      dto.name,
      dto.address,
      dto.type,
    );
    return {
      externalCode: dto.externalCode,
      id: saved.id,
      created: !existing,
    };
  }

  private async upsertMeter(dto: ProvisionMeterDto) {
    const building = await this.buildingsService.findByExternalCode(dto.buildingExternalCode);
    if (!building) {
      throw new Error(`Nie znaleziono budynku: ${dto.buildingExternalCode}`);
    }

    const existing = await this.metersRepository.findOne({
      where: { serial_number: dto.serialNumber },
    });

    if (existing) {
      existing.building_id = building.id;
      existing.type = dto.type;
      existing.unit = dto.unit;
      const saved = await this.metersRepository.save(existing);
      return { serialNumber: dto.serialNumber, id: saved.id, created: false };
    }

    const created = await this.metersService.createMeter(
      building.id,
      dto.type,
      dto.serialNumber,
      dto.unit,
    );
    return { serialNumber: dto.serialNumber, id: created.id, created: true };
  }

  private async upsertSolarPanel(dto: ProvisionSolarPanelDto) {
    const building = await this.buildingsService.findByExternalCode(dto.buildingExternalCode);
    if (!building) {
      throw new Error(`Nie znaleziono budynku: ${dto.buildingExternalCode}`);
    }

    const existing = await this.panelsRepository.findOne({
      where: { serial_number: dto.serialNumber },
    });

    if (existing) {
      existing.building_id = building.id;
      existing.capacity_kwp = dto.capacityKwp;
      existing.installation_date = new Date(dto.installationDate);
      const saved = await this.panelsRepository.save(existing);
      return { serialNumber: dto.serialNumber, id: saved.id, created: false };
    }

    const created = await this.solarPanelsService.createPanel(
      building.id,
      dto.capacityKwp,
      new Date(dto.installationDate),
      dto.serialNumber,
    );
    return { serialNumber: dto.serialNumber, id: created.id, created: true };
  }

  private async upsertUser(dto: ProvisionUserDto) {
    if (dto.role === UserRole.DYREKTOR) {
      const codes = dto.assignedBuildingExternalCodes ?? [];
      if (codes.length === 0) {
        throw new Error('Dyrektor wymaga co najmniej jednego assignedBuildingExternalCode');
      }
      const assignedBuildingIds = await this.resolveBuildingIds(codes);
      const saved = await this.usersService.upsertProvisionedUser(
        dto.email.trim(),
        dto.password,
        UserRole.DYREKTOR,
        assignedBuildingIds,
        [],
      );
      return { email: saved.email, id: saved.id, role: saved.role, created: saved.created };
    }

    const favoriteCodes = dto.favoriteBuildingExternalCodes ?? [];
    const favoriteBuildingIds =
      favoriteCodes.length > 0 ? await this.resolveBuildingIds(favoriteCodes) : [];

    const saved = await this.usersService.upsertProvisionedUser(
      dto.email.trim(),
      dto.password,
      UserRole.MIESZKANIEC,
      [],
      favoriteBuildingIds,
    );
    return { email: saved.email, id: saved.id, role: saved.role, created: saved.created };
  }

  private async resolveBuildingIds(externalCodes: string[]): Promise<string[]> {
    const ids: string[] = [];
    for (const code of externalCodes) {
      const building = await this.buildingsService.findByExternalCode(code);
      if (!building) {
        throw new Error(`Nie znaleziono budynku: ${code}`);
      }
      ids.push(building.id);
    }
    return ids;
  }
}
