import { useState } from 'react';
import { supabase } from '../lib/supabase';

export type ClaimStatus = 'OK_LINKED' | 'ALREADY_LINKED' | 'CONFLICT' | 'NOT_FOUND' | 'ERROR';

export interface ClaimResult {
    status: ClaimStatus;
    passenger_id: string | null;
    message: string;
}

export const useClaim = () => {
    const [claiming, setClaiming] = useState(false);
    const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);

    const claimPassenger = async (): Promise<ClaimResult> => {
        setClaiming(true);
        try {
            const { data, error } = await supabase.rpc('claim_passenger_by_email');

            if (error) throw error;

            const result = data as ClaimResult;
            setClaimResult(result);
            return result;
        } catch (err: any) {
            const errorResult: ClaimResult = {
                status: 'ERROR',
                passenger_id: null,
                message: err.message || 'Unknown error occurred'
            };
            setClaimResult(errorResult);
            return errorResult;
        } finally {
            setClaiming(false);
        }
    };

    const resetClaim = () => {
        setClaimResult(null);
    };

    return { claimPassenger, claiming, claimResult, resetClaim };
};
