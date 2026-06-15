import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { ApiKey } from './api-key.entity';
import { ApiKeyScope } from './api-key-scope.enum';
import { ApiKeyContext } from './api-key-context.interface';

export interface ApiKeyListItem {
  id: string;
  name: string;
  key_prefix: string;
  scope: ApiKeyScope;
  building_id?: string;
  is_active: boolean;
  rate_limit_per_minute: number;
  last_used_at?: Date;
  created_at: Date;
}

export interface CreateApiKeyResult extends ApiKeyListItem {
  raw_key: string;
}

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly repository: Repository<ApiKey>,
  ) {}

  private hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  }

  private generateRawKey(): string {
    return `ec_${randomBytes(24).toString('hex')}`;
  }

  async findAll(): Promise<ApiKeyListItem[]> {
    const keys = await this.repository.find({ order: { created_at: 'DESC' } });
    return keys.map((key) => this.toListItem(key));
  }

  async createKey(
    name: string,
    scope: ApiKeyScope,
    createdById: string,
    buildingId?: string,
    rateLimitPerMinute = 100,
  ): Promise<CreateApiKeyResult> {
    if (scope === ApiKeyScope.BUILDING && !buildingId) {
      throw new ConflictException(
        'Klucz o zakresie budynku wymaga building_id',
      );
    }

    const rawKey = this.generateRawKey();
    const entity = this.repository.create({
      name,
      key_hash: this.hashKey(rawKey),
      key_prefix: rawKey.slice(0, 12),
      scope,
      building_id: scope === ApiKeyScope.BUILDING ? buildingId : undefined,
      created_by_id: createdById,
      rate_limit_per_minute: rateLimitPerMinute,
    });

    const saved = await this.repository.save(entity);

    return {
      ...this.toListItem(saved),
      raw_key: rawKey,
    };
  }

  async revokeKey(id: string): Promise<void> {
    const result = await this.repository.update(id, { is_active: false });
    if (result.affected === 0) {
      throw new NotFoundException('Klucz API nie został znaleziony');
    }
  }

  async deleteKey(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Klucz API nie został znaleziony');
    }
  }

  async validateKey(rawKey: string): Promise<ApiKeyContext | null> {
    const hash = this.hashKey(rawKey);
    const key = await this.repository.findOne({
      where: { key_hash: hash, is_active: true },
    });

    if (!key) return null;

    await this.repository.update(key.id, { last_used_at: new Date() });

    return {
      id: key.id,
      scope: key.scope,
      building_id: key.building_id,
    };
  }

  canAccessBuilding(context: ApiKeyContext, buildingId: string): boolean {
    if (context.scope === ApiKeyScope.ORGANIZATION) return true;
    return context.building_id === buildingId;
  }

  private toListItem(key: ApiKey): ApiKeyListItem {
    return {
      id: key.id,
      name: key.name,
      key_prefix: key.key_prefix,
      scope: key.scope,
      building_id: key.building_id,
      is_active: key.is_active,
      rate_limit_per_minute: key.rate_limit_per_minute,
      last_used_at: key.last_used_at,
      created_at: key.created_at,
    };
  }
}
