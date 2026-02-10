-- =====================================================
-- FIX REDEMPTION RPC AND CONSTRAINTS
-- Migration Date: 2026-02-10
-- =====================================================

-- 1. Drop the check constraint that prevents negative points (needed for redemptions)
ALTER TABLE orange_points_ledger DROP CONSTRAINT IF EXISTS orange_points_ledger_points_check;

-- 2. Update the RPC function to handle defaults and negative values
-- Also fixes the missing source_passenger_id by using the passenger's own ID for redemptions

-- DROP existing function first to allow return type change if needed
DROP FUNCTION IF EXISTS process_redemption_request(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION process_redemption_request(
  p_request_id UUID,
  p_status TEXT,
  p_admin_comment TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_active_points INTEGER;
BEGIN
  -- 1. Get request details
  SELECT * INTO v_request
  FROM redemption_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada';
  END IF;

  IF v_request.status != 'PENDING' THEN
    RAISE EXCEPTION 'La solicitud ya fue procesada';
  END IF;

  -- 2. Handle Rejection
  IF p_status = 'REJECTED' THEN
    UPDATE redemption_requests
    SET status = 'REJECTED',
        admin_comment = p_admin_comment,
        processed_at = NOW()
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true, 'message', 'Solicitud rechazada');
  END IF;

  -- 3. Handle Approval (COMPLETED)
  IF p_status = 'COMPLETED' THEN
    -- Check active balance (sum of all ACTIVE points, including past redemptions)
    SELECT COALESCE(SUM(points), 0) INTO v_active_points
    FROM orange_points_ledger
    WHERE passenger_id = v_request.passenger_id
    AND status = 'ACTIVE'
    AND expires_at > NOW(); 
    
    IF v_active_points < v_request.points_amount THEN
        RAISE EXCEPTION 'Balance insuficiente para aprobar esta solicitud';
    END IF;

    -- Update Request
    UPDATE redemption_requests
    SET status = 'COMPLETED',
        admin_comment = p_admin_comment,
        processed_at = NOW()
    WHERE id = p_request_id;

    -- Deduct Points
    INSERT INTO orange_points_ledger (
        passenger_id,
        source_passenger_id, -- FIX: Set to own ID to satisfy NOT NULL constraint
        points,              -- FIX: Negative points
        reason,              -- FIX: Mapped to 'reason' column (was 'type' in previous snippet, corrected here)
        status,
        credited_at,
        expires_at
    ) VALUES (
        v_request.passenger_id,
        v_request.passenger_id, 
        -v_request.points_amount, 
        'Canje de Puntos',
        'ACTIVE',       -- Must be ACTIVE to affect balance calculation
        NULL,           -- No trip category for redemption
        NOW(),
        NOW() + INTERVAL '50 years' -- Long expiry for deductions
    );

    -- NOTE: In the previous snippet I used 'redemption_request_id' but looking at the schema in 20260209_orange_pass_system.sql
    -- the table `orange_points_ledger` DOES NOT HAVE `redemption_request_id` column.
    -- I should check if I need to add it or if I missed it.
    -- Checking the retrieved previous file... 
    -- 20260209_orange_pass_system.sql lines 68-81 show:
    -- id, passenger_id, source_passenger_id, trip_id, points, reason, trip_category, credited_at, expires_at, status...
    -- It does NOT have redemption_request_id.
    -- So I should NOT try to insert it, or I should ALTER table to add it first if I want tracking.
    -- For now I will omit it to allow the insert to succeed, relying on the 'reason' or a JOIN with redemption_requests if needed later.
    -- OR, I should add the column. Adding the column is better for traceability.
    
    RETURN jsonb_build_object('success', true, 'message', 'Solicitud aprobada y puntos descontados');
  END IF;

  RAISE EXCEPTION 'Estado no válido';
END;
$$;

-- 3. Optional: Add redemption_request_id to ledger for better tracking (Safest to do if we want full traceability)
ALTER TABLE orange_points_ledger 
ADD COLUMN IF NOT EXISTS redemption_request_id UUID REFERENCES redemption_requests(id) ON DELETE SET NULL;

-- 4. Re-update the function to include the new column if we added it above.
-- (Ideally I'd do this in one go, but for clarity I'll redefine it with the column)
CREATE OR REPLACE FUNCTION process_redemption_request(
  p_request_id UUID,
  p_status TEXT,
  p_admin_comment TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_active_points INTEGER;
BEGIN
  -- 1. Get request details
  SELECT * INTO v_request
  FROM redemption_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada';
  END IF;

  IF v_request.status != 'PENDING' THEN
    RAISE EXCEPTION 'La solicitud ya fue procesada';
  END IF;

  -- 2. Handle Rejection
  IF p_status = 'REJECTED' THEN
    UPDATE redemption_requests
    SET status = 'REJECTED',
        admin_comment = p_admin_comment,
        processed_at = NOW()
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true, 'message', 'Solicitud rechazada');
  END IF;

  -- 3. Handle Approval (COMPLETED)
  IF p_status = 'COMPLETED' THEN
    -- Check active balance
    SELECT COALESCE(SUM(points), 0) INTO v_active_points
    FROM orange_points_ledger
    WHERE passenger_id = v_request.passenger_id
    AND status = 'ACTIVE'
    AND expires_at > NOW(); 
    
    IF v_active_points < v_request.points_amount THEN
        RAISE EXCEPTION 'Balance insuficiente para aprobar esta solicitud';
    END IF;

    -- Update Request
    UPDATE redemption_requests
    SET status = 'COMPLETED',
        admin_comment = p_admin_comment,
        processed_at = NOW()
    WHERE id = p_request_id;

    -- Deduct Points
    INSERT INTO orange_points_ledger (
        passenger_id,
        source_passenger_id,
        points,
        reason,
        status,
        credited_at,
        expires_at,
        redemption_request_id
    ) VALUES (
        v_request.passenger_id,
        v_request.passenger_id, 
        -v_request.points_amount, 
        'Canje de Puntos',
        'ACTIVE',
        NOW(),
        NOW() + INTERVAL '50 years',
        v_request.id
    );

    RETURN jsonb_build_object('success', true, 'message', 'Solicitud aprobada y puntos descontados');
  END IF;

  RAISE EXCEPTION 'Estado no válido';
END;
$$;
