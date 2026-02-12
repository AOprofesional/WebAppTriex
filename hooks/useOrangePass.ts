import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/database.types';
import { calculatePointsForCategory, calculateExpirationDate } from '../utils/orangePassHelpers';

type OrangePointsLedger = Tables<'orange_points_ledger'>;
type Passenger = Tables<'passengers'>;
type RedemptionRequest = Tables<'redemption_requests'>;

interface PointsBalance {
    total: number;
    active: number;
    expired: number;
    locked?: number; // Points blocked in pending redemptions
}

interface ReferredPassenger {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_orange_member: boolean;
    referral_linked_at: string | null;
    has_confirmed_purchase: boolean;
    points_awarded: boolean;
}

export const useOrangePass = (passengerId?: string) => {
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState<PointsBalance>({ total: 0, active: 0, expired: 0 });
    const [pointsHistory, setPointsHistory] = useState<OrangePointsLedger[]>([]);
    const [redemptionHistory, setRedemptionHistory] = useState<RedemptionRequest[]>([]);
    const [referredPassengers, setReferredPassengers] = useState<ReferredPassenger[]>([]);

    /**
     * Validate a referral code and return the referrer passenger if valid
     */
    const validateReferralCode = async (code: string): Promise<Passenger | null> => {
        try {
            if (!code || code.trim() === '') return null;

            const { data, error } = await supabase
                .from('passengers')
                .select('*')
                .eq('orange_referral_code', code.toUpperCase().trim())
                .single();

            if (error || !data) return null;
            return data;
        } catch (error) {
            console.error('Error validating referral code:', error);
            return null;
        }
    };

    /**
     * Get current points balance for a passenger
     */
    const fetchPointsBalance = async (pId: string) => {
        try {
            // 1. Get Active Points from Ledger
            const { data: ledgerData, error: ledgerError } = await supabase
                .from('orange_points_ledger')
                .select('*')
                .eq('passenger_id', pId)
                .eq('status', 'ACTIVE');

            if (ledgerError) throw ledgerError;

            // 2. Get Pending Redemption Requests
            const { data: pendingRequests, error: requestsError } = await supabase
                .from('redemption_requests')
                .select('points_amount')
                .eq('passenger_id', pId)
                .eq('status', 'PENDING');

            if (requestsError) throw requestsError;

            const now = new Date();
            let active = 0;
            let expired = 0;
            let locked = 0;

            // Calculate Ledger Points
            ledgerData?.forEach((entry) => {
                const expiresAt = new Date(entry.expires_at);
                if (expiresAt > now) {
                    active += entry.points;
                } else {
                    expired += entry.points;
                }
            });

            // Calculate Locked Points (Pending Redemptions)
            pendingRequests?.forEach((req) => {
                locked += req.points_amount;
            });

            // Formatted Total: Active - Locked (Available to spend)
            const available = Math.max(0, active - locked);

            // We update state with the AVAILABLE points, but keeping track of total active
            // for display purposes if needed. For now, matching the interface:
            // total = available
            // active = active (raw)
            // expired = expired

            // NOTE: To avoid UI confusion, 'total' will be what the user can SPEND.
            const balanceState = {
                total: available,
                active: active,
                expired: expired,
                locked: locked // Optional: we could add this to the interface if we want to show it
            };

            setBalance(balanceState);

            return balanceState;
        } catch (error) {
            console.error('Error fetching points balance:', error);
            return { total: 0, active: 0, expired: 0, locked: 0 };
        }
    };

    /**
     * Get points history (ledger entries)
     */
    const fetchPointsHistory = async (pId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orange_points_ledger')
                .select(`
                    *,
                    source_passenger:passengers!orange_points_ledger_source_passenger_id_fkey (
                        id,
                        first_name,
                        last_name,
                        email
                    ),
                    trip:trips (
                        id,
                        name,
                        destination
                    )
                `)
                .eq('passenger_id', pId)
                .order('credited_at', { ascending: false });

            if (error) throw error;

            setPointsHistory(data || []);
            return data || [];
        } catch (error) {
            console.error('Error fetching points history:', error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get redemption history
     */
    const fetchRedemptionHistory = async (pId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('redemption_requests')
                .select('*')
                .eq('passenger_id', pId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setRedemptionHistory(data || []);
            return data || [];
        } catch (error) {
            console.error('Error fetching redemption history:', error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get list of passengers referred by this passenger
     */
    const fetchReferredPassengers = async (pId: string) => {
        try {
            setLoading(true);
            const { data: referredData, error } = await supabase
                .from('passengers')
                .select(`
                    id,
                    first_name,
                    last_name,
                    email,
                    is_orange_member,
                    referral_linked_at
                `)
                .eq('referred_by_passenger_id', pId)
                .order('referral_linked_at', { ascending: false });

            if (error) throw error;

            if (!referredData || referredData.length === 0) {
                setReferredPassengers([]);
                return [];
            }

            // Optimized: Single query for all referred passengers instead of N+1
            const referredIds = referredData.map((r: any) => r.id);
            const { data: tripPassengersData, error: tripError } = await supabase
                .from('trip_passengers')
                .select(`
                    passenger_id,
                    referral_points_awarded,
                    trip:trips (
                        purchase_confirmed
                    )
                `)
                .in('passenger_id', referredIds);

            if (tripError) throw tripError;

            // Build a map for quick lookup
            const tripDataMap: Record<string, { hasConfirmedPurchase: boolean; pointsAwarded: boolean }> = {};

            tripPassengersData?.forEach((tp: any) => {
                if (!tripDataMap[tp.passenger_id]) {
                    tripDataMap[tp.passenger_id] = {
                        hasConfirmedPurchase: false,
                        pointsAwarded: false
                    };
                }

                if (tp.trip?.purchase_confirmed === true) {
                    tripDataMap[tp.passenger_id].hasConfirmedPurchase = true;
                }

                if (tp.referral_points_awarded === true) {
                    tripDataMap[tp.passenger_id].pointsAwarded = true;
                }
            });

            // Enrich referrals with trip data
            const enrichedReferrals: ReferredPassenger[] = referredData.map((referred: any) => {
                const tripData = tripDataMap[referred.id] || {
                    hasConfirmedPurchase: false,
                    pointsAwarded: false
                };

                return {
                    ...referred,
                    has_confirmed_purchase: tripData.hasConfirmedPurchase,
                    points_awarded: tripData.pointsAwarded,
                };
            });

            setReferredPassengers(enrichedReferrals);
            return enrichedReferrals;
        } catch (error) {
            console.error('Error fetching referred passengers:', error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    /**
     * Award referral points for a specific passenger-trip combination
     * This calls the database function
     */
    const awardReferralPointsForPassenger = async (
        aPassengerId: string,
        tripId: string
    ): Promise<boolean> => {
        try {
            const { data, error } = await supabase.rpc('award_referral_points_for_passenger', {
                p_passenger_id: aPassengerId,
                p_trip_id: tripId,
            });

            if (error) throw error;
            return data === true;
        } catch (error) {
            console.error('Error awarding referral points:', error);
            return false;
        }
    };

    /**
     * Award referral points for all passengers in a trip
     */
    const awardReferralPointsForTrip = async (tripId: string): Promise<number> => {
        try {
            const { data, error } = await supabase.rpc('award_referral_points_for_trip', {
                p_trip_id: tripId,
            });

            if (error) throw error;
            return data || 0;
        } catch (error) {
            console.error('Error awarding referral points for trip:', error);
            return 0;
        }
    };

    /**
     * Manually activate Orange membership for a passenger
     */
    const activateOrangeMembership = async (pId: string): Promise<boolean> => {
        try {
            const { error } = await supabase.rpc('activate_orange_membership', {
                p_passenger_id: pId,
            });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error activating Orange membership:', error);
            return false;
        }
    };

    // Auto-fetch data if passengerId is provided
    useEffect(() => {
        if (passengerId) {
            fetchPointsBalance(passengerId);
            fetchPointsHistory(passengerId);
            fetchRedemptionHistory(passengerId);
            fetchReferredPassengers(passengerId);
        }
    }, [passengerId]);

    return {
        loading,
        balance,
        pointsHistory,
        redemptionHistory,
        referredPassengers,
        validateReferralCode,
        fetchPointsBalance,
        fetchPointsHistory,
        fetchReferredPassengers,
        awardReferralPointsForPassenger,
        awardReferralPointsForTrip,
        activateOrangeMembership,
        refetch: () => {
            if (passengerId) {
                fetchPointsBalance(passengerId);
                fetchPointsHistory(passengerId);
                fetchRedemptionHistory(passengerId);
                fetchReferredPassengers(passengerId);
            }
        },
    };
};
