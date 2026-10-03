-- Add category column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Others';
