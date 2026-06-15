import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey =
      request.headers['x-api-key'] ?? request.headers['X-API-KEY'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('Brak nagłówka X-API-KEY');
    }

    const keyContext = await this.apiKeysService.validateKey(apiKey);
    if (!keyContext) {
      throw new UnauthorizedException('Nieprawidłowy lub nieaktywny klucz API');
    }

    request.apiKey = keyContext;
    return true;
  }
}
