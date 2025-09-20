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