# Conecta Masivo

Aplicación React existente con backend NestJS, PostgreSQL, Prisma, Redis y BullMQ para campañas autorizadas de WhatsApp y SMS. La interfaz se conserva en la raíz; el servicio API está en `backend/`.

## Arranque local

1. Copie las variables: `cp .env.example .env.local` y `cp backend/.env.example backend/.env`.
2. Levante los servicios: `docker compose up -d`.
3. Instale dependencias: `npm install` y `cd backend && npm install`.
4. Genere Prisma y aplique migraciones: `cd backend && npm run prisma:generate && npm run prisma:migrate -- --name init`.
5. No se cargan datos de ejemplo. Cree usuarios desde el flujo protegido de administración o use las cuentas existentes.
6. Inicie API: `npm run start:dev` desde `backend/`.
7. En otra terminal inicie el frontend: `npm run dev -- --port 5173` desde la raíz.

Swagger está disponible en `http://localhost:3000/api/docs`. El frontend usa `http://localhost:3000/api/v1` mediante `VITE_API_URL`.

Genere una clave segura antes de arrancar la API: `openssl rand -hex 32`, y asígnela a `JWT_SECRET` en `backend/.env`. La aplicación rechaza deliberadamente secretos cortos o el valor de ejemplo.

## Campañas y seguridad

- `DEMO` crea destinatarios y métricas deterministas en PostgreSQL sin llamadas externas.
- `TWILIO_TEST` permite exclusivamente contactos con `isTwilioTestNumber`; requiere las variables `TWILIO_*` y usa la API oficial de Twilio.
- `META_TEST` permite solo WhatsApp y contactos con `isTwilioTestNumber`; envía la plantilla Meta de prueba `hello_world` en inglés. El texto personalizado de la campaña no se usa en este modo.
- `LIVE` se bloquea intencionalmente con un error explícito.
- Los contactos inactivos, bloqueados u opt-out nunca son elegibles. `POST /api/v1/contacts/:id/opt-out` revoca ambos consentimientos inmediatamente.
- Todas las rutas salvo `POST /api/v1/auth/login` exigen JWT; la autorización aplica `ADMIN`, `OPERATOR` y `VIEWER`.
- MFA TOTP usa códigos de seis dígitos con periodos de 30 segundos. El administrador puede exigirlo globalmente con `PATCH /api/v1/users/mfa/enforcement` y restablecerlo para una cuenta mediante `POST /api/v1/users/:id/mfa/reset`.

Para probar DEMO: inicie sesión como administrador u operador, cree una campaña con `executionMode: DEMO`, use `POST /api/v1/campaigns/:id/send` y consulte su reporte.

## Twilio Sandbox opcional

Complete en `backend/.env` `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` y/o `TWILIO_SMS_FROM`. Configure el webhook de estado en `POST /api/v1/webhooks/twilio/status`; nunca agregue esas credenciales al repositorio.

## Meta WhatsApp Cloud API (prueba)

En `backend/.env`, agregue `META_WA_ACCESS_TOKEN` (token temporal generado en el panel de API Setup), `META_WA_PHONE_NUMBER_ID` (Phone Number ID, no el WABA ID) y `META_WA_API_VERSION` (por ejemplo `v26.0`). Para webhooks, `META_APP_SECRET` es el secreto de la app y `META_WA_WEBHOOK_VERIFY_TOKEN` es una cadena privada inventada por usted. Configure el callback como `https://<URL-PUBLICA>/api/v1/webhooks/meta`, método `GET/POST`, con el mismo token de verificación. Para localhost necesita un túnel HTTPS público. No comparta tokens ni los agregue al repositorio. El modo `META_TEST` solo envía `hello_world` a contactos con autorización de prueba marcada; Meta no permite reemplazar el contenido de esa plantilla por el texto de campaña.

## Verificación

Ejecute `npm run lint && npm run build` en la raíz y `npm run build` en `backend/`.
