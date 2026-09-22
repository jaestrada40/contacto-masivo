import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UnauthorizedException, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'; import { Request, Response } from 'express'; import { UserRole } from '@prisma/client';
import { validateRequest } from 'twilio';
import { AppService } from './app.service'; import { JwtAuthGuard, LoginThrottleGuard, MetaWebhookGuard, Public, Roles, RolesGuard, TwilioWebhookGuard } from './auth'; import { CampaignDto, ContactDto, ContactStatusDto, CreateUserDto, ImportContactsDto, LoginDto, MfaEnforcementDto, MfaTokenDto, MfaVerifyDto, SegmentDto, SettingsDto, StatusDto, UpdateUserDto } from './dto';
@ApiTags('Conecta Masivo') @Controller() export class AppController {
 constructor(private service:AppService) {}
 @Get('webhooks/meta') @Public() verifyMetaWebhook(@Query() query:Record<string,string>,@Res() res:Response) { if(query['hub.mode']!=='subscribe'||!process.env.META_WA_WEBHOOK_VERIFY_TOKEN||query['hub.verify_token']!==process.env.META_WA_WEBHOOK_VERIFY_TOKEN||!query['hub.challenge']) throw new ForbiddenException('Verificación de webhook Meta inválida'); return res.status(200).type('text/plain').send(query['hub.challenge']); }
 @Post('webhooks/meta') @Public() @UseGuards(MetaWebhookGuard) metaWebhook(@Body() body:any) { return this.service.processMetaWebhook(body); }
 @Post('auth/login') @Public() @UseGuards(LoginThrottleGuard) login(@Body() dto:LoginDto) { return this.service.login(dto.email,dto.password); }
 @Post('auth/mfa/setup') @Public() setupMfa(@Body() dto:MfaTokenDto) { return this.service.setupMfa(dto.mfaToken); }
 @Post('auth/mfa/activate') @Public() activateMfa(@Body() dto:MfaVerifyDto) { return this.service.activateMfa(dto.mfaToken,dto.code); }
 @Post('auth/mfa/verify') @Public() @UseGuards(LoginThrottleGuard) verifyMfa(@Body() dto:MfaVerifyDto) { return this.service.verifyMfa(dto.mfaToken,dto.code); }
 @Get('auth/me') @UseGuards(JwtAuthGuard) me(@Req() req:any) { return this.service.me(req.user.sub); }
 @Get('dashboard/summary') @UseGuards(JwtAuthGuard) summary() { return this.service.dashboard(); }
 @Get('users') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN) users() { return this.service.users(); }
 @Post('users') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN) createUser(@Body() dto:CreateUserDto,@Req() req:any) { return this.service.createUser(dto,req.user.sub); }
 @Patch('users/:id') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN) updateUser(@Param('id') id:string,@Body() dto:UpdateUserDto,@Req() req:any){return this.service.updateUser(id,dto,req.user.sub)}
 @Patch('users/:id/status') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN) statusUser(@Param('id') id:string,@Body() dto:StatusDto,@Req() req:any){return this.service.userStatus(id,dto.isActive,req.user.sub)}
 @Post('users/:id/mfa/reset') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN) resetMfa(@Param('id') id:string,@Req() req:any){return this.service.resetUserMfa(id,req.user.sub)}
 @Patch('users/mfa/enforcement') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN) enforceMfa(@Body() dto:MfaEnforcementDto,@Req() req:any){return this.service.updateMfaEnforcement(dto.mfaEnforced,req.user.sub)}
 @Get('contacts') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR,UserRole.VIEWER) contacts(@Query() q:Record<string,string>){return this.service.contacts(q)}
 @Get('contacts/export') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) async exportContacts(@Res() res:Response){const r=await this.service.contacts({limit:'10000'}); const values=r.data.map(c=>[c.firstName,c.lastName,c.phone,c.email||'',c.department||'',c.zone||'',c.groupName||'',c.whatsappOptIn?'SI':'NO',c.smsOptIn?'SI':'NO'].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n'); res.header('Content-Type','text/csv').attachment('contactos.csv').send('nombres,apellidos,telefono,email,departamento,zona,grupo,consentimiento_whatsapp,consentimiento_sms\n'+values);}
 @Get('contacts/:id') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) contact(@Param('id')id:string){return this.service.contact(id)}
 @Post('contacts') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) createContact(@Body()dto:ContactDto,@Req()r:any){return this.service.createContact(dto,r.user.sub)}
 @Patch('contacts/:id') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) updateContact(@Param('id')id:string,@Body()dto:ContactDto,@Req()r:any){return this.service.updateContact(id,dto,r.user.sub)}
 @Delete('contacts/:id') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN) deleteContact(@Param('id')id:string,@Req()r:any){return this.service.deleteContact(id,r.user.sub)}
 @Patch('contacts/:id/status') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) contactStatus(@Param('id')id:string,@Body()dto:ContactStatusDto,@Req()r:any){return this.service.contactStatus(id,dto.status,r.user.sub)}
 @Post('contacts/:id/opt-out') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) optOut(@Param('id')id:string,@Req()r:any){return this.service.optOut(id,r.user.sub)}
 @Post('contacts/import') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) importContacts(@Body() body:ImportContactsDto,@Req()r:any){return this.service.importContacts(body.contacts,r.user.sub)}
 @Get('segments') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR,UserRole.VIEWER) segments(){return this.service.segments()}
 @Post('segments') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) createSegment(@Body()d:SegmentDto,@Req()r:any){return this.service.createSegment(d,r.user.sub)}
 @Get('segments/:id/contacts') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) segmentContacts(@Param('id')id:string){return this.service.segmentContacts(id)}
 @Get('segments/:id') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) segment(@Param('id')id:string){return this.service.segment(id)}
 @Patch('segments/:id') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) updateSegment(@Param('id')id:string,@Body()d:SegmentDto,@Req()r:any){return this.service.updateSegment(id,d,r.user.sub)}
 @Delete('segments/:id') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) deleteSegment(@Param('id')id:string,@Req()r:any){return this.service.deleteSegment(id,r.user.sub)}
 @Get('campaigns') @UseGuards(JwtAuthGuard) campaigns(){return this.service.campaigns()}
 @Post('campaigns') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) createCampaign(@Body()d:CampaignDto,@Req()r:any){return this.service.createCampaign(d,r.user.sub)}
 @Get('campaigns/:id/recipients') @UseGuards(JwtAuthGuard) recipients(@Param('id')id:string,@Query()q:Record<string,string>){return this.service.recipients(id,q)}
 @Get('campaigns/:id/report') @UseGuards(JwtAuthGuard) campaignReport(@Param('id')id:string){return this.service.report(id)}
 @Post('campaigns/:id/preview') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) preview(@Param('id')id:string){return this.service.previewCampaign(id)}
 @Post('campaigns/:id/send') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) send(@Param('id')id:string,@Req()r:any){return this.service.sendCampaign(id,r.user.sub)}
 @Post('campaigns/:id/cancel') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) cancel(@Param('id')id:string,@Req()r:any){return this.service.cancelCampaign(id,r.user.sub)}
 @Get('campaigns/:id') @UseGuards(JwtAuthGuard) campaign(@Param('id')id:string){return this.service.campaign(id)}
 @Patch('campaigns/:id') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN,UserRole.OPERATOR) updateCampaign(@Param('id')id:string,@Body()d:CampaignDto,@Req()r:any){return this.service.updateCampaign(id,d,r.user.sub)}
 @Get('messages') @UseGuards(JwtAuthGuard) messages(@Query()q:Record<string,string>){return this.service.messages(q)}
 @Get('reports/campaigns') @UseGuards(JwtAuthGuard) reports(){return this.service.reports()}
 @Get('reports/export') @UseGuards(JwtAuthGuard) async exportReports(@Res()res:Response){const r=await this.service.reports();res.header('Content-Type','text/csv').attachment('reporte-campanas.csv').send('nombre,estado,destinatarios\n'+r.map(x=>`"${x.name}",${x.status},${x._count.recipients}`).join('\n'))}
 @Get('settings') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN) settings(){return this.service.settings()}
 @Get('branding') @Public() branding(){return this.service.branding()}
 @Patch('settings') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN) updateSettings(@Body()d:SettingsDto,@Req()r:any){return this.service.updateSettings(d,r.user.sub)}
 @Get('audit-logs') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.ADMIN) audit(){return this.service.auditLogs()}
 @Post('webhooks/twilio/status') @Public() @UseGuards(TwilioWebhookGuard) twilioStatus(@Body() body:Record<string, string>, @Req() request: Request) {
   const authToken = process.env.TWILIO_AUTH_TOKEN;
   const signature = request.header('x-twilio-signature');
   const protocol = request.header('x-forwarded-proto') || request.protocol;
   const url = `${protocol}://${request.get('host')}${request.originalUrl}`;
   if (!authToken || !signature || !validateRequest(authToken, signature, url, body)) throw new UnauthorizedException('Firma Twilio inválida');
   return {received:true,providerMessageId:body.MessageSid};
 }
}
