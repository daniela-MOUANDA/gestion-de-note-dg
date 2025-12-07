-- Migration: Make classe_id optional in inscriptions table
-- This allows students to be enrolled without being assigned to a class initially
-- The department head will assign classes later through the class management interface

ALTER TABLE inscriptions 
ALTER COLUMN classe_id DROP NOT NULL;

-- Add a comment to document this change
COMMENT ON COLUMN inscriptions.classe_id IS 'Optionnel - assigné par le chef de département après inscription';
