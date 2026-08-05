import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/database.types';
import { calculatePointsForCategory, calculateExpirationDate } from '../utils/orangePassHelpers';
import { queryCache } from '../lib/queryCache';

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

interface CachedOrangePass {
    balance: PointsBalance;
    pointsHistory: OrangePointsLedger[];
    redemptionHistory: RedemptionRequest[];
    referredPassengers: ReferredPassenger[];
}

export const useOrangePass = (passengerId?: string) => {
    const cacheKey = `orange_pass:${passengerId || 'none'}`;
    const initialCache = passengerId ? queryCache.get<CachedOrangePass>(cacheKey) : null;

    const [loading, setLoading] = useState(!initialCache && !!passengerId);
    const [balance, setBalance] = useState<PointsBalance>(
        initialCache?.data?.balance || { total: 0, active: 0, expired: 0 }
    );
    const [pointsHistory, setPointsHistory] = useState<OrangePointsLedger[]>(
        initialCache?.data?.pointsHistory || []
    );
    const [redemptionHistory, setRedemptionHistory] = useState<RedemptionRequest[]>(
        initialCache?.data?.redemptionHistory || []
    );
    const [referredPassengers, setReferredPassengers] = useState<ReferredPassenger[]>(
        initialCache?.data?.referredPassengers || []
    );
    const isFirstMount = useRef(true);

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

    const fetchAllData = async (pId: string, force: boolean = false) => {
        if (!pId) return;

        try {
            const currentCache = queryCache.get<CachedOrangePass>(cacheKey);
            if (!currentCache?.data) {
                setLoading(true);
            }

            const [bal, hist, redemptions, refs] = await Promise.all([
                fetchPointsBalance(pId),
                fetchPointsHistory(pId),
                fetchRedemptionHistory(pId),
                fetchReferredPassengers(pId),
            ]);

            const fullData: CachedOrangePass = {
                balance: bal,
                pointsHistory: hist,
                redemptionHistory: redemptions,
                referredPassengers: refs,
            };

            queryCache.set(cacheKey, fullData);
        } catch (err: any) {
            console.error('Error fetching orange pass data:', err?.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get current points balance for a passenger
     */
    const fetchPointsBalance = async (pId: string): Promise<PointsBalance> => {
        try {
            const [ledgerRes, requestsRes] = await Promise.all([
                supabase
                    .from('orange_points_ledger')
                    .select('*')
                    .eq('passenger_id', pId)
                    .eq('status', 'ACTIVE'),
                supabase
                    .from('redemption_requests')
                    .select('points_amount')
                    .eq('passenger_id', pId)
                    .eq('status', 'PENDING'),
            ]);

            if (ledgerRes.error) throw ledgerRes.error;
            if (requestsRes.error) throw requestsRes.error;

            const ledgerData = ledgerRes.data || [];
            const pendingRequests = requestsRes.data || [];

            const now = new Date();
            let earned = 0;
            let redeemed = 0;
            let expired = 0;
            let locked = 0;

            ledgerData.forEach((entry) => {
                const expiresAt = new Date(entry.expires_at);
                if (entry.points > 0) {
                    if (expiresAt > now) {
                        earned += entry.points;
                    } else {
                        expired += entry.points;
                    }
                } else {
                    redeemed += Math.abs(entry.points);
                }
            });

            pendingRequests.forEach((req) => {
                locked += req.points_amount;
            });

            const available = Math.max(0, earned - redeemed - locked);
            const balanceState = {
                total: available,
                active: earned,
                expired: expired,
                locked: locked,
            };

            setBalance(balanceState);
            return balanceState;
        } catch (error: any) {
            console.error('Error fetching points balance:', error?.message);
            return { total: 0, active: 0, expired: 0, locked: 0 };
        }
    };

    /**
     * Get points history (ledger entries)
     */
    const fetchPointsHistory = async (pId: string): Promise<OrangePointsLedger[]> => {
        try {
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

            const history = data || [];
            setPointsHistory(history);
            return history;
        } catch (error: any) {
            console.error('Error fetching points history:', error?.message);
            return [];
        }
    };

    /**
     * Get redemption history
     */
    const fetchRedemptionHistory = async (pId: string): Promise<RedemptionRequest[]> => {
        try {
            const { data, error } = await supabase
                .from('redemption_requests')
                .select('*')
                .eq('passenger_id', pId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const redemptions = data || [];
            setRedemptionHistory(redemptions);
            return redemptions;
        } catch (error: any) {
            console.error('Error fetching redemption history:', error?.message);
            return [];
        }
    };

    /**
     * Get list of passengers referred by this passenger
     */
    const fetchReferredPassengers = async (pId: string): Promise<ReferredPassenger[]> => {
        try {
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

            const tripDataMap: Record<string, { hasConfirmedPurchase: boolean; pointsAwarded: boolean }> = {};

            tripPassengersData?.forEach((tp: any) => {
                if (!tripDataMap[tp.passenger_id]) {
                    tripDataMap[tp.passenger_id] = {
                        hasConfirmedPurchase: false,
                        pointsAwarded: false,
                    };
                }

                if (tp.trip?.purchase_confirmed === true) {
                    tripDataMap[tp.passenger_id].hasConfirmedPurchase = true;
                }

                if (tp.referral_points_awarded === true) {
                    tripDataMap[tp.passenger_id].pointsAwarded = true;
                }
            });

            const enrichedReferrals: ReferredPassenger[] = referredData.map((referred: any) => {
                const tripData = tripDataMap[referred.id] || {
                    hasConfirmedPurchase: false,
                    pointsAwarded: false,
                };

                return {
                    ...referred,
                    has_confirmed_purchase: tripData.hasConfirmedPurchase,
                    points_awarded: tripData.pointsAwarded,
                };
            });

            setReferredPassengers(enrichedReferrals);
            return enrichedReferrals;
        } catch (error: any) {
            console.error('Error fetching referred passengers:', error?.message);
            return [];
        }
    };

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
            queryCache.invalidate(`orange_pass:*`);
            return data === true;
        } catch (error) {
            console.error('Error awarding referral points:', error);
            return false;
        }
    };

    const awardReferralPointsForTrip = async (tripId: string): Promise<number> => {
        try {
            const { data, error } = await supabase.rpc('award_referral_points_for_trip', {
                p_trip_id: tripId,
            });

            if (error) throw error;
            queryCache.invalidate(`orange_pass:*`);
            return data || 0;
        } catch (error) {
            console.error('Error awarding referral points for trip:', error);
            return 0;
        }
    };

    const activateOrangeMembership = async (pId: string): Promise<boolean> => {
        try {
            const { error } = await supabase.rpc('activate_orange_membership', {
                p_passenger_id: pId,
            });

            if (error) throw error;
            queryCache.invalidate(`orange_pass:*`);
            return true;
        } catch (error) {
            console.error('Error activating Orange membership:', error);
            return false;
        }
    };

    // Auto-fetch data if passengerId is provided with SWR
    useEffect(() => {
        if (!passengerId) {
            setLoading(false);
            return;
        }

        const cached = queryCache.get<CachedOrangePass>(cacheKey);
        if (cached?.data) {
            setBalance(cached.data.balance);
            setPointsHistory(cached.data.pointsHistory);
            setRedemptionHistory(cached.data.redemptionHistory);
            setReferredPassengers(cached.data.referredPassengers);
            setLoading(false);

            if (cached.isFresh && isFirstMount.current) {
                isFirstMount.current = false;
                return;
            }
        }

        isFirstMount.current = false;
        fetchAllData(passengerId);
    }, [passengerId]);

    return {
        loading,
        balance,
        pointsHistory,
        redemptionHistory,
        referredPassengers,
        validateReferralCode,
        fetchPointsBalance: (pId: string) => fetchPointsBalance(pId),
        fetchPointsHistory: (pId: string) => fetchPointsHistory(pId),
        fetchReferredPassengers: (pId: string) => fetchReferredPassengers(pId),
        awardReferralPointsForPassenger,
        awardReferralPointsForTrip,
        activateOrangeMembership,
        refetch: () => {
            if (passengerId) {
                fetchAllData(passengerId, true);
            }
        },
    };
};
