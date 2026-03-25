-- 1. Add new columns
ALTER TABLE trip_surveys
ADD COLUMN IF NOT EXISTS rating_general INT, -- Escala 1 a 5
ADD COLUMN IF NOT EXISTS destination_expectation TEXT, -- 'Sí', 'Parcialmente', 'No'
ADD COLUMN IF NOT EXISTS services_ratings JSONB, -- { "Vuelos": 5, "Alojamiento": "N/A" }
ADD COLUMN IF NOT EXISTS had_incident BOOLEAN,
ADD COLUMN IF NOT EXISTS incident_comment TEXT,
ADD COLUMN IF NOT EXISTS would_buy_again TEXT;

-- 2. Make old columns nullable (since V2 ignores NPS, organization, etc.)
ALTER TABLE trip_surveys
ALTER COLUMN nps DROP NOT NULL,
ALTER COLUMN rating_organization DROP NOT NULL,
ALTER COLUMN rating_attention DROP NOT NULL;

-- 3. Create Trigger to award 5 Orange points automatically
CREATE OR REPLACE FUNCTION award_post_trip_survey_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert 5 points directly
    INSERT INTO orange_points_ledger (
        passenger_id,
        source_passenger_id,
        trip_id,
        points,
        reason,
        credited_at,
        expires_at,
        status
    ) VALUES (
        NEW.passenger_id,
        NEW.passenger_id,
        NEW.trip_id,
        5,
        'POST_TRIP_SURVEY',
        NOW(),
        NOW() + INTERVAL '12 months',
        'ACTIVE'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_post_trip_survey_points ON trip_surveys;

CREATE TRIGGER trigger_award_post_trip_survey_points
AFTER INSERT ON trip_surveys
FOR EACH ROW
EXECUTE FUNCTION award_post_trip_survey_points();
