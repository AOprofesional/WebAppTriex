-- Enforce unique email for primary passengers only
-- Companions (where parent_passenger_id IS NOT NULL) can share the parent's email

CREATE UNIQUE INDEX IF NOT EXISTS idx_passengers_unique_email_primary 
ON public.passengers(email) 
WHERE parent_passenger_id IS NULL;

-- Update the parent_passenger_id foreign key to CASCADE on delete.
-- This ensures that if a primary passenger is deleted, their companions are also automatically deleted.
ALTER TABLE public.passengers 
DROP CONSTRAINT IF EXISTS passengers_parent_passenger_id_fkey,
ADD CONSTRAINT passengers_parent_passenger_id_fkey 
FOREIGN KEY (parent_passenger_id) REFERENCES public.passengers(id) ON DELETE CASCADE;

