-- RTI Portal - Complete Database Schema
-- PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================== ENUMS =====================
CREATE TYPE user_role AS ENUM ('citizen', 'nodal_officer', 'cpio', 'faa', 'super_admin');
CREATE TYPE request_status AS ENUM (
  'draft','submitted','payment_pending','payment_done',
  'assigned','under_process','info_requested','additional_fee_pending',
  'additional_fee_paid','replied','transferred','closed','rejected'
);
CREATE TYPE appeal_type AS ENUM ('first_appeal','second_appeal');
CREATE TYPE appeal_status AS ENUM ('filed','under_review','hearing_scheduled','disposed','rejected');
CREATE TYPE payment_status AS ENUM ('pending','success','failed','refunded');
CREATE TYPE payment_mode AS ENUM ('online','ipl','dd','cash');
CREATE TYPE notification_type AS ENUM ('email','sms','in_app');

-- ===================== MASTER TABLES =====================
CREATE TABLE ministries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  name_hindi VARCHAR(255),
  code VARCHAR(20) UNIQUE NOT NULL,
  website VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ministry_id UUID REFERENCES ministries(id),
  name VARCHAR(255) NOT NULL,
  name_hindi VARCHAR(255),
  code VARCHAR(20) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public_authorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id),
  name VARCHAR(500) NOT NULL,
  name_hindi VARCHAR(500),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  cpio_name VARCHAR(255),
  cpio_email VARCHAR(255),
  faa_name VARCHAR(255),
  faa_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== USERS =====================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(15) UNIQUE,
  role user_role DEFAULT 'citizen',
  authority_id UUID REFERENCES public_authorities(id),
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  profile_complete BOOLEAN DEFAULT false,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  aadhaar_last4 VARCHAR(4),
  preferred_language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE otp_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  purpose VARCHAR(50) DEFAULT 'login',
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  attempts INT DEFAULT 0,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== RTI REQUESTS =====================
CREATE TABLE rti_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_number VARCHAR(30) UNIQUE,
  citizen_id UUID REFERENCES users(id) NOT NULL,
  authority_id UUID REFERENCES public_authorities(id) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  information_sought TEXT NOT NULL,
  period_from DATE,
  period_to DATE,
  preferred_response_mode VARCHAR(20) DEFAULT 'email',
  status request_status DEFAULT 'draft',
  is_bpl BOOLEAN DEFAULT false,
  bpl_card_number VARCHAR(50),
  fee_amount NUMERIC(10,2) DEFAULT 10.00,
  fee_waived BOOLEAN DEFAULT false,
  waiver_reason TEXT,
  language VARCHAR(10) DEFAULT 'en',
  assigned_cpio_id UUID REFERENCES users(id),
  deadline_date DATE,
  extended_deadline DATE,
  extension_reason TEXT,
  response_text TEXT,
  response_date TIMESTAMPTZ,
  rejection_reason TEXT,
  transfer_count INT DEFAULT 0,
  template_used UUID,
  quality_score INT,
  ai_suggested_authority UUID REFERENCES public_authorities(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);

CREATE TABLE request_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES rti_requests(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id),
  is_response_doc BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== PAYMENTS =====================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES rti_requests(id),
  citizen_id UUID REFERENCES users(id),
  amount NUMERIC(10,2) NOT NULL,
  status payment_status DEFAULT 'pending',
  mode payment_mode DEFAULT 'online',
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(500),
  receipt_number VARCHAR(50) UNIQUE,
  dd_number VARCHAR(50),
  dd_bank VARCHAR(100),
  dd_date DATE,
  purpose VARCHAR(50) DEFAULT 'rti_fee',
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE additional_fee_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES rti_requests(id),
  raised_by UUID REFERENCES users(id),
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT NOT NULL,
  deadline DATE,
  status VARCHAR(20) DEFAULT 'pending',
  payment_id UUID REFERENCES payments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== TRANSFERS =====================
CREATE TABLE request_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES rti_requests(id),
  from_authority_id UUID REFERENCES public_authorities(id),
  to_authority_id UUID REFERENCES public_authorities(id),
  transferred_by UUID REFERENCES users(id),
  reason TEXT NOT NULL,
  transferred_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== APPEALS =====================
CREATE TABLE appeals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_number VARCHAR(30) UNIQUE,
  request_id UUID REFERENCES rti_requests(id),
  appellant_id UUID REFERENCES users(id),
  authority_id UUID REFERENCES public_authorities(id),
  type appeal_type NOT NULL,
  grounds TEXT NOT NULL,
  relief_sought TEXT NOT NULL,
  status appeal_status DEFAULT 'filed',
  assigned_faa_id UUID REFERENCES users(id),
  hearing_date TIMESTAMPTZ,
  order_text TEXT,
  order_date TIMESTAMPTZ,
  deadline_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== AUDIT & NOTIFICATIONS =====================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50),
  entity_id UUID,
  action VARCHAR(100),
  actor_id UUID REFERENCES users(id),
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type notification_type DEFAULT 'in_app',
  title VARCHAR(255),
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rti_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  subject VARCHAR(500),
  information_sought TEXT,
  description TEXT,
  language VARCHAR(10) DEFAULT 'en',
  usage_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== INDEXES =====================
CREATE INDEX idx_rti_citizen ON rti_requests(citizen_id);
CREATE INDEX idx_rti_authority ON rti_requests(authority_id);
CREATE INDEX idx_rti_status ON rti_requests(status);
CREATE INDEX idx_rti_cpio ON rti_requests(assigned_cpio_id);
CREATE INDEX idx_rti_reg_no ON rti_requests(registration_number);
CREATE INDEX idx_appeals_request ON appeals(request_id);
CREATE INDEX idx_payments_request ON payments(request_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_otp_email ON otp_tokens(email, used, expires_at);

-- ===================== AUTO REGISTRATION NUMBER =====================
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS TRIGGER AS $$
DECLARE
  year_code TEXT;
  seq_num   TEXT;
  prefix    TEXT;
BEGIN
  year_code := TO_CHAR(NOW(), 'YYYY');
  seq_num   := LPAD(NEXTVAL('reg_number_seq')::TEXT, 6, '0');
  IF TG_TABLE_NAME = 'rti_requests' THEN prefix := 'RTI'; ELSE prefix := 'APP'; END IF;
  IF TG_TABLE_NAME = 'rti_requests' THEN
    NEW.registration_number := prefix || '/' || year_code || '/' || seq_num;
    NEW.deadline_date := (NOW() + INTERVAL '30 days')::DATE;
    NEW.submitted_at := NOW();
  ELSE
    NEW.registration_number := prefix || '/' || year_code || '/' || seq_num;
    NEW.deadline_date := (NOW() + INTERVAL '30 days')::DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE reg_number_seq START 1;

CREATE TRIGGER trg_rti_reg_number
  BEFORE UPDATE ON rti_requests
  FOR EACH ROW
  WHEN (OLD.status = 'draft' AND NEW.status = 'submitted')
  EXECUTE FUNCTION generate_registration_number();

CREATE TRIGGER trg_appeal_reg_number
  BEFORE INSERT ON appeals
  FOR EACH ROW
  EXECUTE FUNCTION generate_registration_number();

-- Auto updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_rti_updated_at BEFORE UPDATE ON rti_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appeals_updated_at BEFORE UPDATE ON appeals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
