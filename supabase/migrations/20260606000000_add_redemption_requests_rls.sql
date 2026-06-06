-- Migration to add missing RLS policies to redemption_requests
-- Required for the Orange Pass points redemption to function properly

-- Enable Row Level Security (in case it wasn't already)
ALTER TABLE redemption_requests ENABLE ROW LEVEL SECURITY;

-- 1. Read Access: Passengers can only view their own redemption requests
CREATE POLICY "Passengers can read own redemption requests" 
ON redemption_requests 
FOR SELECT 
USING (
    passenger_id = auth.uid() OR
    passenger_id IN (SELECT id FROM passengers WHERE profile_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'superadmin', 'operator'))
);

-- 2. Insert Access: Passengers can only insert their own redemption requests
CREATE POLICY "Passengers can insert own redemption requests" 
ON redemption_requests 
FOR INSERT 
WITH CHECK (
    passenger_id = auth.uid() OR
    passenger_id IN (SELECT id FROM passengers WHERE profile_id = auth.uid())
);

-- 3. Update Access: Passengers cannot update their requests once submitted. 
-- Only admins can process/update them, which is typically handled via Service Role or RPCs.
