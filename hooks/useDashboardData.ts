import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateTripStatus } from '../utils/dateUtils';

export interface DashboardStats {
    activeTrips: number;
    upcomingTrips: number;
    pendingDocuments: number;
    totalPoints: number;
}

export interface UpcomingTrip {
    id: string;
    name: string;
    destination: string;
    start_date: string;
    end_date: string;
    passenger_count: number;
    status_commercial: string | null;
}

export interface RecentActivity {
    id: string;
    title: string;
    description: string;
    time: string;
    icon: string;
    iconBg: string;
}

export const useDashboardData = () => {
    const [stats, setStats] = useState<DashboardStats>({
        activeTrips: 0,
        upcomingTrips: 0,
        pendingDocuments: 0,
        totalPoints: 0
    });
    const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Helper to format time ago
    const getTimeAgo = (timestamp: string): string => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffInMs = now.getTime() - then.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) return 'Hace un momento';
        if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
        if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
        return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch all active trips
            const { data: trips, error: tripsError } = await supabase
                .from('trips')
                .select('id, name, destination, start_date, end_date, status_commercial, archived_at')
                .is('archived_at', null)
                .order('start_date', { ascending: true });

            if (tripsError) throw tripsError;

            // Calculate stats based on dates
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            let activeTrips = 0;
            let upcomingTripsCount = 0;

            trips?.forEach(trip => {
                const status = calculateTripStatus(trip.start_date, trip.end_date);
                if (status === 'EN_CURSO') activeTrips++;
                if (status === 'PREVIO') upcomingTripsCount++;
            });

            // Get upcoming trips for display (next 5 trips starting soon) with passenger counts
            const upcomingTripsWithCounts = await Promise.all(
                (trips
                    ?.filter(trip => calculateTripStatus(trip.start_date, trip.end_date) === 'PREVIO')
                    .slice(0, 5) || [])
                    .map(async (trip) => {
                        // Get passenger count for this trip
                        const { count } = await supabase
                            .from('trip_passengers')
                            .select('*', { count: 'exact', head: true })
                            .eq('trip_id', trip.id);

                        return {
                            id: trip.id,
                            name: trip.name,
                            destination: trip.destination,
                            start_date: trip.start_date,
                            end_date: trip.end_date,
                            passenger_count: count || 0,
                            status_commercial: trip.status_commercial
                        };
                    })
            );

            // Get pending documents count
            const { count: pendingDocs, error: docsError } = await supabase
                .from('passenger_documents')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'uploaded');

            if (docsError) console.error('Error fetching documents:', docsError);

            // Get total points (Current System Liability - All Active Points)
            let totalPoints = 0;
            try {
                const { data: ledgerData, error: ledgerError } = await supabase
                    .from('orange_points_ledger')
                    .select('points')
                    .eq('status', 'ACTIVE');

                if (!ledgerError && ledgerData) {
                    totalPoints = ledgerData.reduce((sum, entry) => sum + (entry.points || 0), 0);
                }
            } catch (err) {
                console.error('Error fetching ledger points:', err);
                totalPoints = 0;
            }

            // Get recent document activity (last 10 actions)
            const { data: recentDocs, error: recentActivityError } = await supabase
                .from('passenger_documents')
                .select(`
                    id, 
                    status, 
                    updated_at, 
                    passengers (first_name, last_name), 
                    required_documents (
                        document_types (name)
                    )
                `)
                .in('status', ['uploaded', 'approved', 'rejected'])
                .order('updated_at', { ascending: false })
                .limit(10);

            if (recentActivityError) {
                console.error('Error fetching recent activity:', recentActivityError);
            }

            // Map to activity items
            const activity: RecentActivity[] = (recentDocs || []).map((doc: any) => {
                const passenger = doc.passengers;
                const passengerName = passenger
                    ? `${passenger.first_name || ''} ${passenger.last_name || ''}`.trim()
                    : 'Pasajero';
                const docType = doc.required_documents?.document_types?.name || 'Documento';
                const timeAgo = getTimeAgo(doc.updated_at);

                if (doc.status === 'approved') {
                    return {
                        id: doc.id,
                        title: 'Documento aprobado',
                        description: `${docType} - ${passengerName}`,
                        time: timeAgo,
                        icon: 'check_circle',
                        iconBg: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    };
                } else if (doc.status === 'rejected') {
                    return {
                        id: doc.id,
                        title: 'Documento rechazado',
                        description: `${docType} - ${passengerName}`,
                        time: timeAgo,
                        icon: 'cancel',
                        iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    };
                } else {
                    return {
                        id: doc.id,
                        title: 'Documento cargado',
                        description: `${docType} - ${passengerName}`,
                        time: timeAgo,
                        icon: 'upload_file',
                        iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    };
                }
            });

            setStats({
                activeTrips,
                upcomingTrips: upcomingTripsCount,
                pendingDocuments: pendingDocs || 0,
                totalPoints
            });

            setUpcomingTrips(upcomingTripsWithCounts);
            setRecentActivity(activity);

        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            // Set default values on error
            setStats({
                activeTrips: 0,
                upcomingTrips: 0,
                pendingDocuments: 0,
                totalPoints: 0
            });
            setUpcomingTrips([]);
        } finally {
            setLoading(false);
        }
    };

    return {
        stats,
        upcomingTrips,
        recentActivity,
        loading,
        refresh: fetchDashboardData
    };
};
