import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/user-role.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Odczytaj wymagane role z metadanych endpointu
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. Jeśli endpoint nie ma @Roles() — przepuść każdego
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Pobierz użytkownika wstrzykniętego przez JwtAuthGuard
    const { user } = context.switchToHttp().getRequest();

    // 4. Sprawdź czy rola użytkownika jest na liście dozwolonych
    const hasRole = requiredRoles.includes(user?.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Dostęp wymaga roli: ${requiredRoles.join(' lub ')}`,
      );
    }

    return true;
  }
}