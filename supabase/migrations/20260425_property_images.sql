-- Add images array column to properties table for storing multiple photos
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
