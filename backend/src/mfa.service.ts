import { BadRequestException, Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { generateSecret, generateURI, verify } from 'otplib';

@Injectable()
export class MfaService {
  private readonly key = createHash('sha256').update(process.env.JWT_SECRET || '').digest();
  generateSecret() { return generateSecret(); }
  encrypt(secret: string) { const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', this.key, iv); const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]); return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`; }
  decrypt(value: string) { try { const [iv, tag, encrypted] = value.split('.').map(part => Buffer.from(part, 'base64url')); const decipher = createDecipheriv('aes-256-gcm', this.key, iv); decipher.setAuthTag(tag); return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'); } catch { throw new BadRequestException('La configuración MFA no es válida; solicite un restablecimiento al administrador'); } }
  async verify(secret: string, code: string) { return (await verify({ token: code.replace(/\s/g, ''), secret, period: 30, epochTolerance: 30 })).valid; }
  otpauthUri(email: string, secret: string) { return generateURI({ issuer: 'Conecta Masivo', label: email, secret, period: 30 }); }
}
