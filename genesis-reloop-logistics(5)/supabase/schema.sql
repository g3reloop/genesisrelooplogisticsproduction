-- Genesis Reloop Logistics Database Schema
-- This schema supports the complete circular economy platform for Used Cooking Oil (UCO)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_role AS ENUM ('SUPPLIER', 'DRIVER', 'BUYER', 'ADMIN');
CREATE TYPE job_status AS ENUM ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE oil_contamination AS ENUM ('NONE', 'LOW', 'HIGH');
CREATE TYPE oil_state AS ENUM ('LIQUID', 'SOLID', 'MIXED');
CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE notification_type AS ENUM ('JOB_UPDATE', 'EARNINGS', 'SYSTEM', 'PROMOTIONAL');
CREATE TYPE dwtn_status AS ENUM ('MINTED', 'IN_TRANSIT', 'DELIVERED', 'VERIFIED', 'COMPLETED');
CREATE TYPE service_type AS ENUM ('ISCC_COMPLIANCE', 'MASS_BALANCE', 'FRAUD_PREVENTION', 'AUTOMATED_DOCS');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'PAUSED', 'EXPIRED');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    reset_token TEXT,
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES users(id) NOT NULL,
    driver_id UUID REFERENCES users(id),
    buyer_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    volume_liters DECIMAL(10,2) NOT NULL,
    price_per_liter DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (volume_liters * price_per_liter) STORED,
    collection_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    collection_coordinates POINT,
    delivery_coordinates POINT,
    collection_date TIMESTAMP WITH TIME ZONE NOT NULL,
    delivery_date TIMESTAMP WITH TIME ZONE,
    status job_status DEFAULT 'PENDING',
    oil_contamination oil_contamination DEFAULT 'NONE',
    oil_state oil_state DEFAULT 'LIQUID',
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver profiles table
CREATE TABLE driver_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    vehicle_type TEXT NOT NULL,
    vehicle_capacity DECIMAL(10,2) NOT NULL,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_expiry DATE,
    background_check_status verification_status DEFAULT 'PENDING',
    is_available BOOLEAN DEFAULT TRUE,
    current_location POINT,
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_jobs INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier profiles table
CREATE TABLE supplier_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    address TEXT NOT NULL,
    coordinates POINT,
    license_number TEXT,
    waste_license TEXT,
    average_monthly_volume DECIMAL(10,2),
    preferred_collection_times TEXT[],
    special_requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buyer profiles table
CREATE TABLE buyer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    address TEXT NOT NULL,
    coordinates POINT,
    license_number TEXT,
    processing_capacity DECIMAL(10,2),
    quality_requirements TEXT,
    payment_terms TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DWTN (Digital Waste Transfer Notes) table
CREATE TABLE dwtn_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id BIGINT UNIQUE NOT NULL,
    batch_id TEXT UNIQUE NOT NULL,
    job_id UUID REFERENCES jobs(id),
    origin_id UUID REFERENCES users(id),
    collector_id UUID REFERENCES users(id),
    processor_id UUID REFERENCES users(id),
    volume_liters DECIMAL(10,2) NOT NULL,
    collection_time TIMESTAMP WITH TIME ZONE NOT NULL,
    delivery_time TIMESTAMP WITH TIME ZONE,
    collection_gps POINT,
    delivery_gps POINT,
    restaurant_details JSONB,
    processor_details JSONB,
    status dwtn_status DEFAULT 'MINTED',
    metadata_uri TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    blockchain_tx_hash TEXT,
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Genesis Points table
CREATE TABLE genesis_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    points DECIMAL(10,2) NOT NULL DEFAULT 0,
    source TEXT NOT NULL, -- 'JOB_COMPLETION', 'REFERRAL', 'BONUS', etc.
    source_id UUID, -- Reference to job, referral, etc.
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    job_id UUID REFERENCES jobs(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'GBP',
    type TEXT NOT NULL, -- 'PAYMENT', 'REFUND', 'BONUS', etc.
    status payment_status DEFAULT 'PENDING',
    stripe_payment_intent_id TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File uploads table
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    upload_type TEXT NOT NULL, -- 'LICENSE', 'VEHICLE_PHOTO', 'DOCUMENT', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver locations table (for real-time tracking)
CREATE TABLE driver_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES users(id) NOT NULL,
    location POINT NOT NULL,
    heading DECIMAL(5,2),
    speed DECIMAL(5,2),
    accuracy DECIMAL(5,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service subscriptions table
CREATE TABLE service_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    service_type service_type NOT NULL,
    status subscription_status DEFAULT 'ACTIVE',
    stripe_subscription_id TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, service_type)
);

-- Mass balance monitoring data
CREATE TABLE mass_balance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    subscription_id UUID REFERENCES service_subscriptions(id) NOT NULL,
    input_volume DECIMAL(10,2) NOT NULL,
    output_volume DECIMAL(10,2) NOT NULL,
    waste_volume DECIMAL(10,2) DEFAULT 0,
    efficiency_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN input_volume > 0 THEN (output_volume / input_volume) * 100
            ELSE 0
        END
    ) STORED,
    record_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fraud prevention alerts
CREATE TABLE fraud_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    subscription_id UUID REFERENCES service_subscriptions(id) NOT NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    data JSONB,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automated documentation records
CREATE TABLE automated_docs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    subscription_id UUID REFERENCES service_subscriptions(id) NOT NULL,
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    file_path TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- AI job matching history
CREATE TABLE ai_job_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) NOT NULL,
    driver_id UUID REFERENCES users(id) NOT NULL,
    match_score DECIMAL(5,2) NOT NULL,
    ai_reasoning TEXT,
    is_accepted BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI route optimizations
CREATE TABLE ai_route_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES users(id) NOT NULL,
    original_route JSONB NOT NULL,
    optimized_route JSONB NOT NULL,
    savings_percentage DECIMAL(5,2),
    ai_reasoning TEXT,
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI customer support conversations
CREATE TABLE ai_support_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id TEXT NOT NULL,
    messages JSONB NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_jobs_supplier_id ON jobs(supplier_id);
CREATE INDEX idx_jobs_driver_id ON jobs(driver_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_collection_date ON jobs(collection_date);
CREATE INDEX idx_driver_profiles_user_id ON driver_profiles(user_id);
CREATE INDEX idx_supplier_profiles_user_id ON supplier_profiles(user_id);
CREATE INDEX idx_buyer_profiles_user_id ON buyer_profiles(user_id);
CREATE INDEX idx_dwtn_records_batch_id ON dwtn_records(batch_id);
CREATE INDEX idx_dwtn_records_token_id ON dwtn_records(token_id);
CREATE INDEX idx_dwtn_records_status ON dwtn_records(status);
CREATE INDEX idx_genesis_points_user_id ON genesis_points(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX idx_driver_locations_timestamp ON driver_locations(timestamp);
CREATE INDEX idx_service_subscriptions_user_id ON service_subscriptions(user_id);
CREATE INDEX idx_mass_balance_records_user_id ON mass_balance_records(user_id);
CREATE INDEX idx_fraud_alerts_user_id ON fraud_alerts(user_id);
CREATE INDEX idx_ai_job_matches_job_id ON ai_job_matches(job_id);
CREATE INDEX idx_ai_job_matches_driver_id ON ai_job_matches(driver_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dwtn_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE genesis_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mass_balance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_route_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_support_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for jobs table
CREATE POLICY "Users can view jobs they're involved in" ON jobs
    FOR SELECT USING (
        auth.uid() = supplier_id OR 
        auth.uid() = driver_id OR 
        auth.uid() = buyer_id
    );

CREATE POLICY "Suppliers can create jobs" ON jobs
    FOR INSERT WITH CHECK (auth.uid() = supplier_id);

CREATE POLICY "Users can update jobs they're involved in" ON jobs
    FOR UPDATE USING (
        auth.uid() = supplier_id OR 
        auth.uid() = driver_id OR 
        auth.uid() = buyer_id
    );

-- RLS Policies for driver_profiles table
CREATE POLICY "Drivers can view own profile" ON driver_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update own profile" ON driver_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for supplier_profiles table
CREATE POLICY "Suppliers can view own profile" ON supplier_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Suppliers can update own profile" ON supplier_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for buyer_profiles table
CREATE POLICY "Buyers can view own profile" ON buyer_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Buyers can update own profile" ON buyer_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for dwtn_records table
CREATE POLICY "Users can view DWTNs they're involved in" ON dwtn_records
    FOR SELECT USING (
        auth.uid() = origin_id OR 
        auth.uid() = collector_id OR 
        auth.uid() = processor_id
    );

CREATE POLICY "Collectors can create DWTNs" ON dwtn_records
    FOR INSERT WITH CHECK (auth.uid() = collector_id);

CREATE POLICY "Users can update DWTNs they're involved in" ON dwtn_records
    FOR UPDATE USING (
        auth.uid() = origin_id OR 
        auth.uid() = collector_id OR 
        auth.uid() = processor_id
    );

-- RLS Policies for genesis_points table
CREATE POLICY "Users can view own points" ON genesis_points
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for transactions table
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for file_uploads table
CREATE POLICY "Users can view own uploads" ON file_uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload files" ON file_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for driver_locations table
CREATE POLICY "Drivers can view own locations" ON driver_locations
    FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own locations" ON driver_locations
    FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- RLS Policies for service_subscriptions table
CREATE POLICY "Users can view own subscriptions" ON service_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create subscriptions" ON service_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for mass_balance_records table
CREATE POLICY "Users can view own mass balance records" ON mass_balance_records
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for fraud_alerts table
CREATE POLICY "Users can view own fraud alerts" ON fraud_alerts
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for automated_docs table
CREATE POLICY "Users can view own automated docs" ON automated_docs
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for ai_job_matches table
CREATE POLICY "Users can view own job matches" ON ai_job_matches
    FOR SELECT USING (auth.uid() = driver_id);

-- RLS Policies for ai_route_optimizations table
CREATE POLICY "Drivers can view own route optimizations" ON ai_route_optimizations
    FOR SELECT USING (auth.uid() = driver_id);

-- RLS Policies for ai_support_conversations table
CREATE POLICY "Users can view own support conversations" ON ai_support_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create support conversations" ON ai_support_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions for updated_at timestamps
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

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_profiles_updated_at BEFORE UPDATE ON driver_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_profiles_updated_at BEFORE UPDATE ON supplier_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyer_profiles_updated_at BEFORE UPDATE ON buyer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dwtn_records_updated_at BEFORE UPDATE ON dwtn_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_subscriptions_updated_at BEFORE UPDATE ON service_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_support_conversations_updated_at BEFORE UPDATE ON ai_support_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();