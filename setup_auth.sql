-- SQL script to set up authentication for Space Oracle CRM
-- This script creates a users table and adds a test user

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add a test user with username 'admin' and password 'password123'
-- In a production environment, you would use proper password hashing
INSERT INTO users (username, password)
VALUES ('admin', 'password123')
ON CONFLICT (username) DO NOTHING;

-- Instructions:
-- 1. Connect to your Supabase project
-- 2. Run this SQL script in the SQL Editor
-- 3. You can now log in with username 'admin' and password 'password123'
-- 4. For production, implement proper password hashing with bcrypt or similar 