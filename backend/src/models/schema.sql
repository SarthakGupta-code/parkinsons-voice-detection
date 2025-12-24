-- PD Voice Detect Database Schema
-- PostgreSQL Database Schema for Parkinson's Voice Detection System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'healthcare_worker', 'specialist')),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    language_preference VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP
);

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    village VARCHAR(255),
    district VARCHAR(255),
    state VARCHAR(255),
    assigned_worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    medical_history JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Recordings table
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    healthcare_worker_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    recording_type VARCHAR(50) NOT NULL CHECK (recording_type IN (
        'sustained_vowel',
        'rapid_syllable',
        'reading_passage',
        'spontaneous_speech'
    )),
    file_url VARCHAR(500) NOT NULL,
    file_size_bytes INTEGER,
    duration_seconds DECIMAL(5,2),
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    volume_db DECIMAL(5,2),
    clarity_snr DECIMAL(5,2),
    stability_zcr DECIMAL(5,2),
    recorded_at TIMESTAMP DEFAULT NOW(),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    is_analyzed BOOLEAN DEFAULT false,
    analysis_job_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Analysis results table
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE NOT NULL,
    risk_percentage DECIMAL(5,2) NOT NULL CHECK (risk_percentage >= 0 AND risk_percentage <= 100),
    confidence_level DECIMAL(5,2) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 100),
    biomarkers JSONB NOT NULL, -- All 42 parameters
    shap_values JSONB,
    model_version VARCHAR(50),
    analyzed_at TIMESTAMP DEFAULT NOW(),
    reviewed_by_specialist UUID REFERENCES users(id) ON DELETE SET NULL,
    specialist_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Progress tracking table
CREATE TABLE patient_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    analysis_id UUID REFERENCES analysis_results(id) ON DELETE CASCADE NOT NULL,
    risk_change_percentage DECIMAL(5,2),
    key_parameter_changes JSONB,
    assessment_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    analysis_id UUID REFERENCES analysis_results(id) ON DELETE CASCADE NOT NULL,
    report_type VARCHAR(50) DEFAULT 'standard',
    pdf_url VARCHAR(500),
    shared_via VARCHAR(50), -- 'email', 'sms', 'whatsapp'
    shared_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit log table (for HIPAA compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_patients_worker ON patients(assigned_worker_id);
CREATE INDEX idx_patients_user ON patients(user_id);
CREATE INDEX idx_recordings_patient ON recordings(patient_id);
CREATE INDEX idx_recordings_worker ON recordings(healthcare_worker_id);
CREATE INDEX idx_recordings_analyzed ON recordings(is_analyzed);
CREATE INDEX idx_analysis_recording ON analysis_results(recording_id);
CREATE INDEX idx_analysis_risk ON analysis_results(risk_percentage);
CREATE INDEX idx_progress_patient ON patient_progress(patient_id);
CREATE INDEX idx_progress_date ON patient_progress(assessment_date);
CREATE INDEX idx_reports_patient ON reports(patient_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for soft delete
CREATE OR REPLACE FUNCTION soft_delete_patient()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE patients SET deleted_at = NOW() WHERE id = OLD.id;
    RETURN NULL;
END;
$$ language 'plpgsql';

