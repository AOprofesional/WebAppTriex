-- =====================================================
-- ORANGE PASS REFERRAL & POINTS SYSTEM - MVP
-- Migration Date: 2026-02-09
-- =====================================================

-- =====================================================
-- 1. ADD ORANGE PASS FIELDS TO PASSENGERS TABLE
-- =====================================================

ALTER TABLE passengers
ADD COLUMN IF NOT EXISTS orange_member_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS orange_referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_passenger_id UUID REFERENCES passengers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS referred_by_code_raw TEXT,
ADD COLUMN IF NOT EXISTS referral_linked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_orange_member BOOLEAN DEFAULT FALSE;

-- Create index for referral lookups
CREATE INDEX IF NOT EXISTS idx_passengers_orange_referral_code ON passengers(orange_referral_code);
CREATE INDEX IF NOT EXISTS idx_passengers_referred_by ON passengers(referred_by_passenger_id);

COMMENT ON COLUMN passengers.orange_member_number IS 'Unique member number (10 digits), generated when passenger becomes Orange member';
COMMENT ON COLUMN passengers.orange_referral_code IS 'Unique referral code (8 chars alphanumeric), used to refer new passengers';
COMMENT ON COLUMN passengers.referred_by_passenger_id IS 'Passenger ID of the referrer (who referred this passenger)';
COMMENT ON COLUMN passengers.referred_by_code_raw IS 'Raw referral code entered by operator (for audit trail)';
COMMENT ON COLUMN passengers.referral_linked_at IS 'Timestamp when referral was successfully validated and linked';
COMMENT ON COLUMN passengers.is_orange_member IS 'True if passenger is an active Orange Pass member (activated after first purchase)';

-- =====================================================
-- 2. ADD TRIP CATEGORY AND PURCHASE TRACKING TO TRIPS
-- =====================================================

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS trip_category TEXT,
ADD COLUMN IF NOT EXISTS purchase_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS purchase_confirmed_at TIMESTAMPTZ;

-- Create index for filtering by category
CREATE INDEX IF NOT EXISTS idx_trips_category ON trips(trip_category);

COMMENT ON COLUMN trips.trip_category IS 'Trip destination category for points calculation: BRASIL_ANDINOS, CARIBE, USA_CANADA, EUROPA, EXOTICOS, OTRO';
COMMENT ON COLUMN trips.purchase_confirmed IS 'Whether trip purchase is confirmed (triggers points accrual)';
COMMENT ON COLUMN trips.purchase_confirmed_at IS 'Timestamp when purchase was confirmed';

-- Add check constraint for valid categories
ALTER TABLE trips
ADD CONSTRAINT chk_trip_category 
CHECK (trip_category IS NULL OR trip_category IN ('BRASIL_ANDINOS', 'CARIBE', 'USA_CANADA', 'EUROPA', 'EXOTICOS', 'OTRO'));

-- =====================================================
-- 3. ADD REFERRAL TRACKING TO TRIP_PASSENGERS
-- =====================================================

ALTER TABLE trip_passengers
ADD COLUMN IF NOT EXISTS referral_points_awarded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS referral_points_awarded_at TIMESTAMPTZ;

-- Create index for checking awarded status
CREATE INDEX IF NOT EXISTS idx_trip_passengers_points_awarded ON trip_passengers(referral_points_awarded);

COMMENT ON COLUMN trip_passengers.referral_points_awarded IS 'Prevents duplicate points accrual for same passenger-trip combination';
COMMENT ON COLUMN trip_passengers.referral_points_awarded_at IS 'Timestamp when referral points were awarded';

-- =====================================================
-- 4. CREATE ORANGE_POINTS_LEDGER TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS orange_points_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id UUID NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
    source_passenger_id UUID NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    points INTEGER NOT NULL CHECK (points >= 0),
    reason TEXT NOT NULL,
    trip_category TEXT,
    credited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REDEEMED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orange_points_ledger_passenger ON orange_points_ledger(passenger_id);
CREATE INDEX IF NOT EXISTS idx_orange_points_ledger_source ON orange_points_ledger(source_passenger_id);
CREATE INDEX IF NOT EXISTS idx_orange_points_ledger_trip ON orange_points_ledger(trip_id);
CREATE INDEX IF NOT EXISTS idx_orange_points_ledger_status ON orange_points_ledger(status);
CREATE INDEX IF NOT EXISTS idx_orange_points_ledger_expires ON orange_points_ledger(expires_at);

-- Unique constraint to prevent duplicate accrual
CREATE UNIQUE INDEX IF NOT EXISTS idx_orange_points_unique_accrual 
ON orange_points_ledger(source_passenger_id, trip_id, reason);

-- Comments
COMMENT ON TABLE orange_points_ledger IS 'Ledger of all Orange Pass points transactions';
COMMENT ON COLUMN orange_points_ledger.passenger_id IS 'Referrer - passenger who receives the points';
COMMENT ON COLUMN orange_points_ledger.source_passenger_id IS 'Referee - passenger who was referred';
COMMENT ON COLUMN orange_points_ledger.trip_id IS 'Associated trip (nullable for future non-trip points)';
COMMENT ON COLUMN orange_points_ledger.points IS 'Number of points awarded';
COMMENT ON COLUMN orange_points_ledger.reason IS 'Reason for points (e.g., REFERRAL_PURCHASE)';
COMMENT ON COLUMN orange_points_ledger.trip_category IS 'Trip category at time of accrual';
COMMENT ON COLUMN orange_points_ledger.credited_at IS 'When points were credited';
COMMENT ON COLUMN orange_points_ledger.expires_at IS 'When points expire (12 months from credited_at)';
COMMENT ON COLUMN orange_points_ledger.status IS 'Point status: ACTIVE, EXPIRED, or REDEEMED';

-- =====================================================
-- 5. DATABASE FUNCTIONS
-- =====================================================

-- Function to generate unique Orange member number (10 digits)
CREATE OR REPLACE FUNCTION generate_orange_member_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    number_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 10-digit number
        new_number := LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0');
        
        -- Check if it already exists
        SELECT EXISTS(
            SELECT 1 FROM passengers WHERE orange_member_number = new_number
        ) INTO number_exists;
        
        -- Exit loop if unique
        EXIT WHEN NOT number_exists;
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique Orange referral code (8 chars alphanumeric)
CREATE OR REPLACE FUNCTION generate_orange_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluding similar chars: I,O,0,1
BEGIN
    LOOP
        -- Generate 8-character code
        new_code := '';
        FOR i IN 1..8 LOOP
            new_code := new_code || SUBSTR(chars, 1 + FLOOR(RANDOM() * LENGTH(chars))::INT, 1);
        END LOOP;
        
        -- Check if it already exists
        SELECT EXISTS(
            SELECT 1 FROM passengers WHERE orange_referral_code = new_code
        ) INTO code_exists;
        
        -- Exit loop if unique
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to activate Orange membership (manual call or trigger)
CREATE OR REPLACE FUNCTION activate_orange_membership(p_passenger_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Only activate if not already a member
    IF NOT EXISTS (
        SELECT 1 FROM passengers 
        WHERE id = p_passenger_id AND is_orange_member = TRUE
    ) THEN
        UPDATE passengers
        SET 
            is_orange_member = TRUE,
            orange_member_number = generate_orange_member_number(),
            orange_referral_code = generate_orange_referral_code(),
            updated_at = NOW()
        WHERE id = p_passenger_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate points for a trip category
CREATE OR REPLACE FUNCTION get_points_for_category(p_category TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE p_category
        WHEN 'BRASIL_ANDINOS' THEN 10
        WHEN 'CARIBE' THEN 20
        WHEN 'USA_CANADA' THEN 30
        WHEN 'EUROPA' THEN 40
        WHEN 'EXOTICOS' THEN 40
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to award referral points for a passenger-trip combination
CREATE OR REPLACE FUNCTION award_referral_points_for_passenger(
    p_passenger_id UUID,
    p_trip_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_passenger RECORD;
    v_trip RECORD;
    v_points INTEGER;
    v_already_awarded BOOLEAN;
BEGIN
    -- Get passenger info
    SELECT * INTO v_passenger FROM passengers WHERE id = p_passenger_id;
    
    -- Get trip info
    SELECT * INTO v_trip FROM trips WHERE id = p_trip_id;
    
    -- Check if passenger was referred
    IF v_passenger.referred_by_passenger_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if points already awarded
    SELECT referral_points_awarded INTO v_already_awarded
    FROM trip_passengers
    WHERE passenger_id = p_passenger_id AND trip_id = p_trip_id;
    
    IF v_already_awarded = TRUE THEN
        RETURN FALSE;
    END IF;
    
    -- Check if trip category is eligible
    IF v_trip.trip_category IS NULL OR v_trip.trip_category = 'OTRO' THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate points
    v_points := get_points_for_category(v_trip.trip_category);
    
    IF v_points = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Insert ledger entry (will fail if duplicate due to unique constraint)
    BEGIN
        INSERT INTO orange_points_ledger (
            passenger_id,
            source_passenger_id,
            trip_id,
            points,
            reason,
            trip_category,
            credited_at,
            expires_at,
            status
        ) VALUES (
            v_passenger.referred_by_passenger_id,
            p_passenger_id,
            p_trip_id,
            v_points,
            'REFERRAL_PURCHASE',
            v_trip.trip_category,
            NOW(),
            NOW() + INTERVAL '12 months',
            'ACTIVE'
        );
    EXCEPTION
        WHEN unique_violation THEN
            -- Already awarded, silently return
            RETURN FALSE;
    END;
    
    -- Mark as awarded in trip_passengers
    UPDATE trip_passengers
    SET 
        referral_points_awarded = TRUE,
        referral_points_awarded_at = NOW()
    WHERE passenger_id = p_passenger_id AND trip_id = p_trip_id;
    
    -- Activate referrer's membership if not already activated
    PERFORM activate_orange_membership(v_passenger.referred_by_passenger_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to award points for all passengers in a trip
CREATE OR REPLACE FUNCTION award_referral_points_for_trip(p_trip_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_passenger_rec RECORD;
BEGIN
    FOR v_passenger_rec IN 
        SELECT passenger_id FROM trip_passengers WHERE trip_id = p_trip_id
    LOOP
        IF award_referral_points_for_passenger(v_passenger_rec.passenger_id, p_trip_id) THEN
            v_count := v_count + 1;
        END IF;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger to activate membership when passenger's first trip is purchased
CREATE OR REPLACE FUNCTION trigger_activate_membership_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
    v_trip RECORD;
BEGIN
    -- Only proceed if this is a new purchase confirmation
    IF NEW.purchase_confirmed = TRUE AND (OLD.purchase_confirmed IS NULL OR OLD.purchase_confirmed = FALSE) THEN
        -- Activate membership for all passengers in this trip
        FOR v_trip IN 
            SELECT DISTINCT passenger_id FROM trip_passengers WHERE trip_id = NEW.id
        LOOP
            PERFORM activate_orange_membership(v_trip.passenger_id);
        END LOOP;
        
        -- Award referral points
        PERFORM award_referral_points_for_trip(NEW.id);
        
        -- Update confirmation timestamp
        NEW.purchase_confirmed_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_trip_purchase_confirmed ON trips;
CREATE TRIGGER trigger_trip_purchase_confirmed
BEFORE UPDATE OF purchase_confirmed ON trips
FOR EACH ROW
EXECUTE FUNCTION trigger_activate_membership_on_purchase();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on orange_points_ledger
ALTER TABLE orange_points_ledger ENABLE ROW LEVEL SECURITY;

-- Policy: Passengers can only view their own points ledger
CREATE POLICY "Passengers can view own points"
ON orange_points_ledger
FOR SELECT
USING (
    passenger_id = auth.uid() OR
    passenger_id IN (SELECT id FROM passengers WHERE profile_id = auth.uid())
);

-- Policy: Only admins can insert/update/delete points (via service role)
-- No INSERT/UPDATE/DELETE policies for regular users - only backend functions

-- Admin/service role has full access (default behavior with service_role key)

COMMENT ON POLICY "Passengers can view own points" ON orange_points_ledger IS 'Passengers can only view points ledger entries where they are the recipient';

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions to authenticated users where appropriate
GRANT EXECUTE ON FUNCTION get_points_for_category(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_orange_member_number() TO service_role;
GRANT EXECUTE ON FUNCTION generate_orange_referral_code() TO service_role;
GRANT EXECUTE ON FUNCTION activate_orange_membership(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION award_referral_points_for_passenger(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION award_referral_points_for_trip(UUID) TO service_role;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
