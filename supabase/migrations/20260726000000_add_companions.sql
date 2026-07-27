-- Drop UNIQUE constraint on email if it exists (so multiple passengers can share the same email)
ALTER TABLE public.passengers DROP CONSTRAINT IF EXISTS passengers_email_key;

-- Add parent_passenger_id to link companions to a main passenger (optional but recommended for structure)
ALTER TABLE public.passengers ADD COLUMN IF NOT EXISTS parent_passenger_id UUID REFERENCES public.passengers(id);

-- Make sure we can index it for faster queries
CREATE INDEX IF NOT EXISTS idx_passengers_parent_id ON public.passengers(parent_passenger_id);

-- Update the handle_new_user trigger to link ALL matching passengers to the new profile_id, not just the first one
-- We need to see if this trigger exists and what its name is. Since we don't know the exact name, we can create or replace a specific function for it.
-- Actually, the standard Supabase Auth trigger is often named `on_auth_user_created`. Let's create a new function and trigger to ensure passengers are linked on login if they aren't already.

CREATE OR REPLACE FUNCTION public.link_passengers_to_profile()
RETURNS trigger AS $$
BEGIN
  -- When a new profile is created (which happens after auth.users insertion), link all passengers with matching email
  UPDATE public.passengers
  SET profile_id = NEW.id
  WHERE email = NEW.email AND profile_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists, if not create it on profiles table
DROP TRIGGER IF EXISTS on_profile_created_link_passengers ON public.profiles;
CREATE TRIGGER on_profile_created_link_passengers
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.link_passengers_to_profile();
