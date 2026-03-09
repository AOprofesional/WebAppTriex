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

            // Single query: fetch all active trips WITH embedded passenger counts.
            // Eliminates the N+1 pattern (was: one query per upcoming trip).
            const { data: trips, error: tripsError } = await supabase
                .from('trips')
                .select('id, name, destination, start_date, end_date, status_commercial, archived_at, trip_passengers(count)')
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

            // Build upcoming trips list from the already-fetched data (no extra queries)
            const upcomingTripsWithCounts = (trips
                ?.filter(trip => calculateTripStatus(trip.start_date, trip.end_date) === 'PREVIO')
                .slice(0, 5) || [])
                .map((trip: any) => ({
                    id: trip.id,
                    name: trip.name,
                    destination: trip.destination,
                    start_date: trip.start_date,
                    end_date: trip.end_date,
                    // trip_passengers is an array of aggregated rows: [{count: N}]
                    passenger_count: trip.trip_passengers?.[0]?.count ?? 0,
                    status_commercial: trip.status_commercial
                }));

            // Get pending documents count
            const { count: pendingDocs, error: docsError } = await supabase
                .from('passenger_documents')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'uploaded');

            if (docsError) console.error('Error fetching documents:', docsError);

            // Get total active points via SQL SUM (avoids loading all rows into JS)
            let totalPoints = 0;
            try {
                const { data: pointsData, error: pointsError } = await supabase
                    .rpc('get_total_active_points');

                if (!pointsError && pointsData !== null) {
                    totalPoints = Number(pointsData);
                }
            } catch (err) {
                console.error('Error fetching ledger points:', err);
                totalPoints = 0;
            }

            // Fetch recent activities from multiple sources
            const [docsRes, passengersRes, vouchersRes] = await Promise.all([
                supabase
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
                    .limit(10),
                supabase
                    .from('passengers')
                    .select('id, first_name, last_name, created_at')
                    .order('created_at', { ascending: false })
                    .limit(10),
                supabase
                    .from('vouchers')
                    .select('id, title, passengers(first_name, last_name), created_at')
                    .order('created_at', { ascending: false })
                    .limit(10)
            ]);

            const activityItems: (RecentActivity & { rawDate: Date })[] = [];

            // 1. Process Documents
            if (docsRes.data) {
                docsRes.data.forEach((doc: any) => {
                    const passenger = doc.passengers;
                    const passengerName = passenger
                        ? `${passenger.first_name || ''} ${passenger.last_name || ''}`.trim()
                        : 'Pasajero';
                    const docType = doc.required_documents?.document_types?.name || 'Documento';
                    const timeAgo = getTimeAgo(doc.updated_at);

                    let item: RecentActivity & { rawDate: Date };

                    if (doc.status === 'approved') {
                        item = {
                            id: doc.id,
                            title: 'Documento aprobado',
                            description: `${docType} - ${passengerName}`,
                            time: timeAgo,
                            icon: 'check_circle',
                            iconBg: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                            rawDate: new Date(doc.updated_at)
                        };
                    } else if (doc.status === 'rejected') {
                        item = {
                            id: doc.id,
                            title: 'Documento rechazado',
                            description: `${docType} - ${passengerName}`,
                            time: timeAgo,
                            icon: 'cancel',
                            iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                            rawDate: new Date(doc.updated_at)
                        };
                    } else {
                        item = {
                            id: doc.id,
                            title: 'Documento cargado',
                            description: `${docType} - ${passengerName}`,
                            time: timeAgo,
                            icon: 'upload_file',
                            iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                            rawDate: new Date(doc.updated_at)
                        };
                    }
                    activityItems.push(item);
                });
            }

            // 2. Process New Passengers
            if (passengersRes.data) {
                passengersRes.data.forEach((p: any) => {
                    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
                    activityItems.push({
                        id: p.id,
                        title: 'Nuevo pasajero registrado',
                        description: fullName || 'Sin nombre',
                        time: getTimeAgo(p.created_at),
                        icon: 'person_add',
                        iconBg: 'bg-orange-50 text-primary dark:bg-orange-900/30 dark:text-primary',
                        rawDate: new Date(p.created_at)
                    });
                });
            }

            // 3. Process Vouchers
            if (vouchersRes.data) {
                vouchersRes.data.forEach((v: any) => {
                    const passenger = v.passengers;
                    const passengerName = passenger
                        ? `${passenger.first_name || ''} ${passenger.last_name || ''}`.trim()
                        : 'Pasajero';
                    activityItems.push({
                        id: v.id,
                        title: 'Voucher cargado',
                        description: `${v.title || 'Voucher'} - ${passengerName}`,
                        time: getTimeAgo(v.created_at),
                        icon: 'receipt_long',
                        iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
                        rawDate: new Date(v.created_at)
                    });
                });
            }

            // Sort all activities by date descending and take top 10
            activityItems.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

            // Remove rawDate before setting state
            const activity: RecentActivity[] = activityItems.slice(0, 10).map(({ rawDate, ...rest }) => rest);

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
