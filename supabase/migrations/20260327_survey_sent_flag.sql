-- =====================================================
-- END OF TRIP SURVEY AUTOMATION
-- Migration Date: 2026-03-27
-- =====================================================

-- Add survey_sent flag to trips table to prevent duplicate survey emails
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS survey_sent BOOLEAN DEFAULT FALSE;

-- Create index for performance on chronological queries
CREATE INDEX IF NOT EXISTS idx_trips_survey_sent ON trips(end_date, survey_sent);

COMMENT ON COLUMN trips.survey_sent IS 'Indicates if the end of trip survey email has been automatically dispatched';
