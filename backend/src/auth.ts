import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { validateRequest } from 'twilio';
import { UserRole } from '@prisma/client';
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
export const Public = () => SetMetadata('isPublic', true);
@Injectable()
export class LoginThrottleGuard implements CanActivate {
  private readonly attempts = new Map<string, { count: number; resetAt: number }>();
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const key = request.ip || request.socket.remoteAddress || 'unknown';
    const now = Date.now(); const current = this.attempts.get(key);
    if (!current || current.resetAt <= now) { this.attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 }); return true; }
    if (current.count >= 10) throw new ForbiddenException('Demasiados intentos de inicio de sesión; intente de nuevo en 15 minutos');
    current.count += 1; return true;
  }
}
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest(); const value = request.headers.authorization;
    if (!value?.startsWith('Bearer ')) throw new UnauthorizedException('Token de acceso requerido');
    try { request.user = await this.jwt.verifyAsync(value.slice(7)); if (request.user.mfaChallenge) throw new UnauthorizedException('Debe completar la verificación MFA'); return true; } catch { throw new UnauthorizedException('Token inválido o expirado'); }
  }
}
@Injectable()
export class TwilioWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const signature = request.headers['x-twilio-signature'];
    if (!authToken || typeof signature !== 'string') throw new UnauthorizedException('Webhook Twilio no configurado o sin firma');
    const protocol = request.headers['x-forwarded-proto'] || request.protocol;
    const url = `${protocol}://${request.get('host')}${request.originalUrl}`;
    if (!validateRequest(authToken, signature, url, request.body || {})) throw new UnauthorizedException('Firma Twilio inválida');
    return true;
  }
}
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const roles = Reflect.getMetadata('roles', context.getHandler()) as UserRole[] | undefined;
    if (!roles || roles.includes(context.switchToHttp().getRequest().user.role)) return true;
    throw new ForbiddenException('No tiene permisos para esta operación');
  }
}
