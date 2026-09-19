-- ==========================================================
-- CONECTA MASIVO - ESQUEMA DE BASE DE DATOS POSTGRESQL (DQL / DDL)
-- Preparado para PostgreSQL 14+ / Supabase / Cloud SQL / AWS RDS
-- ==========================================================

-- Extensión para generación de UUIDs si se desea
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios y Roles
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Hash bcrypt, nunca texto plano
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'operador', 'consulta')),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    avatar_url TEXT,
    ultimo_acceso TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Contactos y Consentimiento (RGPD / LPDP Compliant)
CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    nombres VARCHAR(120) NOT NULL,
    apellidos VARCHAR(120) NOT NULL,
    dpi VARCHAR(30),
    telefono VARCHAR(30) NOT NULL UNIQUE, -- Formato E.164 (ej. +50255555555)
    email VARCHAR(255),
    departamento VARCHAR(80),
    zona VARCHAR(50),
    grupo VARCHAR(100),
    fecha_registro DATE DEFAULT CURRENT_DATE,
    consentimiento_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    consentimiento_sms BOOLEAN NOT NULL DEFAULT FALSE,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'bloqueado')),
    fecha_consentimiento DATE NOT NULL,
    fuente_consentimiento VARCHAR(255) NOT NULL,
    fecha_baja DATE,
    motivo_baja TEXT,
    es_numero_prueba_twilio BOOLEAN NOT NULL DEFAULT FALSE,
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_telefono ON contacts(telefono);
CREATE INDEX IF NOT EXISTS idx_contacts_estado ON contacts(estado);
CREATE INDEX IF NOT EXISTS idx_contacts_zona ON contacts(zona);
CREATE INDEX IF NOT EXISTS idx_contacts_grupo ON contacts(grupo);

-- 3. Tabla de Segmentos Dinámicos
CREATE TABLE IF NOT EXISTS segments (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    criterios_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    color_tag VARCHAR(30) DEFAULT 'blue',
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Campañas
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('recordatorio', 'aviso', 'informativa', 'promocion', 'urgente')),
    canal VARCHAR(20) NOT NULL CHECK (canal IN ('whatsapp', 'sms', 'ambos')),
    programacion VARCHAR(20) NOT NULL CHECK (programacion IN ('ahora', 'programado')),
    fecha_programada TIMESTAMPTZ,
    segmento_id VARCHAR(64) REFERENCES segments(id) ON DELETE SET NULL,
    segmento_nombre VARCHAR(150),
    total_destinatarios INT NOT NULL DEFAULT 0,
    mensaje TEXT NOT NULL,
    plantilla_whatsapp VARCHAR(100),
    modo VARCHAR(30) NOT NULL CHECK (modo IN ('demo', 'twilio_test')),
    estado VARCHAR(30) NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'programada', 'enviando', 'completada', 'cancelada', 'fallida')),
    
    -- Métricas de agregación
    enviados INT DEFAULT 0,
    entregados INT DEFAULT 0,
    leidos INT DEFAULT 0,
    fallidos INT DEFAULT 0,
    pendientes INT DEFAULT 0,
    costo_estimado NUMERIC(10, 2) DEFAULT 0.00,

    creado_por VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio_envio TIMESTAMPTZ,
    fecha_fin_envio TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_campaigns_estado ON campaigns(estado);
CREATE INDEX IF NOT EXISTS idx_campaigns_fecha ON campaigns(fecha_creacion);

-- 5. Tabla de Registro Individual de Mensajes (Trazabilidad y Auditoría de Proveedor)
CREATE TABLE IF NOT EXISTS messages_log (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    fecha_hora TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    contacto_id VARCHAR(64) REFERENCES contacts(id) ON DELETE CASCADE,
    contacto_nombre VARCHAR(255) NOT NULL,
    contacto_telefono VARCHAR(30) NOT NULL,
    campana_id VARCHAR(64) REFERENCES campaigns(id) ON DELETE CASCADE,
    campana_nombre VARCHAR(200) NOT NULL,
    canal VARCHAR(20) NOT NULL CHECK (canal IN ('whatsapp', 'sms')),
    mensaje_texto TEXT NOT NULL,
    plantilla_utilizada VARCHAR(100),
    estado VARCHAR(30) NOT NULL CHECK (estado IN ('pendiente', 'en_cola', 'enviado', 'entregado', 'leido', 'fallido', 'cancelado')),
    motivo_error TEXT,
    costo_estimado NUMERIC(8, 4) DEFAULT 0.0000,
    proveedor_id VARCHAR(100), -- Twilio Message SID (ej. SMxxxxxxxx)
    modo VARCHAR(30) NOT NULL CHECK (modo IN ('demo', 'twilio_test'))
);

CREATE INDEX IF NOT EXISTS idx_messages_campana ON messages_log(campana_id);
CREATE INDEX IF NOT EXISTS idx_messages_contacto ON messages_log(contacto_id);
CREATE INDEX IF NOT EXISTS idx_messages_estado ON messages_log(estado);
CREATE INDEX IF NOT EXISTS idx_messages_fecha ON messages_log(fecha_hora);

-- 6. Tabla de Auditoría General del Sistema
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    fecha_hora TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    usuario_id VARCHAR(64),
    usuario_nombre VARCHAR(150),
    usuario_email VARCHAR(255),
    usuario_rol VARCHAR(30),
    accion VARCHAR(80) NOT NULL,
    entidad VARCHAR(200) NOT NULL,
    detalles TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_fecha ON audit_logs(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_audit_accion ON audit_logs(accion);

-- 7. Configuración de Organización y Políticas
CREATE TABLE IF NOT EXISTS organization_settings (
    id INT PRIMARY KEY DEFAULT 1,
    nombre VARCHAR(150) NOT NULL,
    logo_texto VARCHAR(20) DEFAULT 'CM',
    correo_soporte VARCHAR(255) NOT NULL,
    telefono_soporte VARCHAR(50),
    sitio_web VARCHAR(255),
    twilio_account_sid VARCHAR(100),
    twilio_whatsapp_from VARCHAR(50),
    twilio_sms_from VARCHAR(50),
    costo_whatsapp_utility_mil NUMERIC(8, 2) DEFAULT 25.00,
    costo_whatsapp_marketing_mil NUMERIC(8, 2) DEFAULT 42.50,
    costo_sms_mil NUMERIC(8, 2) DEFAULT 35.00,
    alerta_costo_umbral NUMERIC(8, 2) DEFAULT 50.00,
    horario_permitido_inicio TIME DEFAULT '08:00:00',
    horario_permitido_fin TIME DEFAULT '20:00:00',
    permitir_envios_fin_semana BOOLEAN DEFAULT TRUE,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
