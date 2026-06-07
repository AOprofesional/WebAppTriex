-- Fix: Award points when passenger is added to an already confirmed trip
CREATE OR REPLACE FUNCTION trigger_award_points_on_trip_passenger_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_confirmed BOOLEAN;
BEGIN
    SELECT purchase_confirmed INTO v_confirmed FROM trips WHERE id = NEW.trip_id;
    
    IF v_confirmed = TRUE THEN
        PERFORM award_referral_points_for_passenger(NEW.passenger_id, NEW.trip_id);
        PERFORM activate_orange_membership(NEW.passenger_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_trip_passenger_insert_points ON trip_passengers;
CREATE TRIGGER trigger_trip_passenger_insert_points
AFTER INSERT ON trip_passengers
FOR EACH ROW
EXECUTE FUNCTION trigger_award_points_on_trip_passenger_insert();

-- Fix: Award points when referred_by_passenger_id is updated for a passenger who already has a confirmed trip
CREATE OR REPLACE FUNCTION trigger_award_points_on_referral_link()
RETURNS TRIGGER AS $$
DECLARE
    v_trip_id UUID;
BEGIN
    IF NEW.referred_by_passenger_id IS NOT NULL AND (OLD.referred_by_passenger_id IS NULL OR OLD.referred_by_passenger_id != NEW.referred_by_passenger_id) THEN
        SELECT tp.trip_id INTO v_trip_id
        FROM trip_passengers tp
        JOIN trips t ON t.id = tp.trip_id
        WHERE tp.passenger_id = NEW.id AND t.purchase_confirmed = TRUE
        LIMIT 1;

        IF v_trip_id IS NOT NULL THEN
            PERFORM award_referral_points_for_passenger(NEW.id, v_trip_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_award_points_on_referral_link ON passengers;
CREATE TRIGGER trigger_award_points_on_referral_link
AFTER UPDATE OF referred_by_passenger_id ON passengers
FOR EACH ROW
EXECUTE FUNCTION trigger_award_points_on_referral_link();
