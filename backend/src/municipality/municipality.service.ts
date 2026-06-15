import {
  ConflictException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MunicipalitySettings } from './municipality-settings.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user-role.enum';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { ApiKeyScope } from '../api-keys/api-key-scope.enum';
import { AuthService } from '../auth/auth.service';
import { InitialSetupDto, UpdateMunicipalitySettingsDto } from './dto/municipality.dto';

export interface PublicMunicipalitySettings {
  municipality_name: string;
  tagline: string;
  air_quality_station_name: string;
  is_configured: boolean;
}

@Injectable()
export class MunicipalityService implements OnModuleInit {
  private static readonly SINGLETON_ID = 1;

  constructor(
    @InjectRepository(MunicipalitySettings)
    private readonly settingsRepository: Repository<MunicipalitySettings>,
    private readonly usersService: UsersService,
    private readonly apiKeysService: ApiKeysService,
    private readonly authService: AuthService,
  ) {}

  async onModuleInit() {
    await this.ensureSettingsRow();
  }

  async ensureSettingsRow(): Promise<MunicipalitySettings> {
    let settings = await this.settingsRepository.findOne({
      where: { id: MunicipalityService.SINGLETON_ID },
    });

    if (!settings) {
      settings = this.settingsRepository.create({
        id: MunicipalityService.SINGLETON_ID,
        municipality_name: '',
        tagline: '',
        air_quality_station_name: 'Stacja pomiarowa — centrum gminy',
        is_configured: false,
      });
      settings = await this.settingsRepository.save(settings);
    }

    return settings;
  }

  async needsSetup(): Promise<boolean> {
    return !(await this.usersService.hasUrzędnik());
  }

  async getPublicSettings(): Promise<PublicMunicipalitySettings> {
    const settings = await this.ensureSettingsRow();
    return this.toPublic(settings);
  }

  async getSettingsForAdmin(): Promise<MunicipalitySettings> {
    return this.ensureSettingsRow();
  }

  async updateSettings(dto: UpdateMunicipalitySettingsDto): Promise<PublicMunicipalitySettings> {
    const settings = await this.ensureSettingsRow();

    if (dto.municipality_name !== undefined) {
      settings.municipality_name = dto.municipality_name.trim();
    }
    if (dto.tagline !== undefined) {
      settings.tagline = dto.tagline.trim();
    }
    if (dto.air_quality_station_name !== undefined) {
      settings.air_quality_station_name = dto.air_quality_station_name.trim();
    }
    if (dto.is_configured !== undefined) {
      settings.is_configured = dto.is_configured;
    }

    if (settings.municipality_name) {
      settings.is_configured = true;
    }

    const saved = await this.settingsRepository.save(settings);
    return this.toPublic(saved);
  }

  async initialSetup(dto: InitialSetupDto) {
    if (!(await this.needsSetup())) {
      throw new ConflictException('Konfiguracja początkowa została już wykonana');
    }

    const admin = await this.usersService.createUser(
      dto.admin_email.trim(),
      dto.admin_password,
      UserRole.URZEDNIK,
    );

    const settings = await this.ensureSettingsRow();
    settings.municipality_name = dto.municipality_name.trim();
    settings.tagline =
      dto.tagline?.trim() ||
      `Monitoring energii i jakości środowiska — ${dto.municipality_name.trim()}`;
    settings.is_configured = true;
    await this.settingsRepository.save(settings);

    const apiKey = await this.apiKeysService.createKey(
      'Integracja zewnętrzna',
      ApiKeyScope.ORGANIZATION,
      admin.id,
    );

    const auth = await this.authService.login(dto.admin_email.trim(), dto.admin_password);

    return {
      settings: this.toPublic(settings),
      access_token: auth.access_token,
      role: auth.role,
      api_key: apiKey.raw_key,
    };
  }

  private toPublic(settings: MunicipalitySettings): PublicMunicipalitySettings {
    return {
      municipality_name: settings.municipality_name,
      tagline: settings.tagline,
      air_quality_station_name: settings.air_quality_station_name,
      is_configured: settings.is_configured,
    };
  }
}
