import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Matches, Min, MinLength, ValidateNested } from 'class-validator';
import { CampaignChannel, CampaignStatus, CampaignType, ContactStatus, ExecutionMode, UserRole } from '@prisma/client';
export class LoginDto { @IsEmail() email!: string; @IsString() @MinLength(8) password!: string; }
export class MfaTokenDto { @IsString() mfaToken!: string; }
export class MfaVerifyDto extends MfaTokenDto { @Matches(/^\d{6}$/, { message: 'El código MFA debe tener 6 dígitos' }) code!: string; }
export class MfaEnforcementDto { @IsBoolean() mfaEnforced!: boolean; }
export class CreateUserDto { @IsString() @IsNotEmpty() name!: string; @IsEmail() email!: string; @IsString() @MinLength(8) password!: string; @IsEnum(UserRole) role!: UserRole; }
export class UpdateUserDto { @IsOptional() @IsString() name?: string; @IsOptional() @IsEmail() email?: string; @IsOptional() @IsEnum(UserRole) role?: UserRole; }
export class StatusDto { @IsBoolean() isActive!: boolean; }
export class ContactDto {
 @IsString() firstName!: string; @IsString() lastName!: string; @IsOptional() @IsString() documentId?: string;
 @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phone debe tener formato E.164' }) phone!: string;
 @IsOptional() @IsEmail() email?: string; @IsOptional() @IsString() department?: string; @IsOptional() @IsString() zone?: string;
 @IsOptional() @IsString() departmentOrZone?: string; // compatibilidad temporal con clientes anteriores
 @IsOptional() @IsString() groupName?: string;
 @IsOptional() @IsEnum(ContactStatus) status?: ContactStatus; @IsOptional() @IsBoolean() whatsappOptIn?: boolean; @IsOptional() @IsBoolean() smsOptIn?: boolean;
 @IsOptional() @IsString() consentSource?: string; @IsOptional() @IsBoolean() isTwilioTestNumber?: boolean;
}
export class ContactStatusDto { @IsEnum(ContactStatus) status!: ContactStatus; }
export class ImportContactsDto { @IsArray() @ValidateNested({ each: true }) @Type(() => ContactDto) contacts!: ContactDto[]; }
export class SegmentDto { @IsString() name!: string; @IsOptional() @IsString() description?: string; @IsObject() filters!: Record<string, unknown>; @IsOptional() @IsBoolean() isDynamic?: boolean; }
export class CampaignDto {
 @IsString() name!: string; @IsEnum(CampaignType) type!: CampaignType; @IsEnum(CampaignChannel) channel!: CampaignChannel; @IsEnum(ExecutionMode) executionMode!: ExecutionMode;
 @IsString() @MinLength(1) message!: string; @IsOptional() @IsString() whatsappTemplate?: string; @IsOptional() @IsObject() variables?: Record<string, string>;
 @IsOptional() @IsString() scheduledAt?: string; @IsOptional() @IsString() segmentId?: string; @IsOptional() @IsArray() contactIds?: string[];
}
export class SettingsDto { @IsOptional() @IsString() organizationName?: string; @IsOptional() @IsString() logoDataUrl?: string | null; @IsOptional() @IsEmail() supportEmail?: string; @IsOptional() @IsString() supportPhone?: string; @IsOptional() @IsInt() @Min(0) allowedStartHour?: number; @IsOptional() @IsInt() @Min(0) allowedEndHour?: number; @IsOptional() @Type(() => Number) whatsappUtilityRatePerThousand?: number; @IsOptional() @Type(() => Number) whatsappMarketingRatePerThousand?: number; @IsOptional() @Type(() => Number) smsRatePerThousand?: number; }
