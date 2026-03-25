import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePassenger } from '../hooks/usePassenger';
import { useInitialSurvey } from '../hooks/useInitialSurvey';
import { InitialSurveyModal } from './InitialSurveyModal';

export const GlobalSurveyWrapper: React.FC = () => {
    const { role } = useAuth();
    const { passenger, loading: passengerLoading } = usePassenger();
    const { existingSurvey, loading: surveyLoading } = useInitialSurvey(passenger?.id ?? null);
    
    const [showSurvey, setShowSurvey] = useState(false);

    useEffect(() => {
        // Only show if user is a passenger and has loaded
        if (role !== 'passenger' || !passenger || passengerLoading || surveyLoading) return;

        // Si no tiene encuesta inicial respondida, mostrar el modal
        if (!existingSurvey) {
            const key = `initial_survey_dismissed_${passenger.id}`;
            if (!localStorage.getItem(key)) {
                // Pequeño delay para no mostrarlo tan abruptamente apenas entra
                const timer = setTimeout(() => setShowSurvey(true), 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [role, passenger, passengerLoading, surveyLoading, existingSurvey]);

    const handleClose = () => {
        if (passenger) {
            localStorage.setItem(`initial_survey_dismissed_${passenger.id}`, 'true');
        }
        setShowSurvey(false);
    };

    const handleSuccess = () => {
        if (passenger) {
            localStorage.removeItem(`initial_survey_dismissed_${passenger.id}`);
        }
        setShowSurvey(false);
    };

    if (!showSurvey || !passenger) return null;

    return (
        <InitialSurveyModal 
            isOpen={showSurvey}
            onClose={handleClose}
            passengerId={passenger.id}
            onSubmitSuccess={handleSuccess}
        />
    );
};
