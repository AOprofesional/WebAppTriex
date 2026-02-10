
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Redemptions } from './Redemptions';

// Types
interface Member {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    orange_member_number: string | null;
    orange_referral_code: string | null;
    points_balance: number;
    referred_count: number;
}

interface Transaction {
    id: string;
    passenger: { first_name: string; last_name: string; email: string };
    source_passenger: { first_name: string; last_name: string } | null;
    points: number;
    reason: string;
    trip_category: string | null;
    status: string;
    created_at: string;
    expires_at: string;
}

export const AdminPoints: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'members' | 'transactions' | 'redemptions'>('members');
    const [searchTerm, setSearchTerm] = useState('');
    const [members, setMembers] = useState<Member[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalPoints: 0,
        activeMembers: 0,
        expiringPoints: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Members (Passengers with Orange Pass)
            const { data: membersData, error: membersError } = await supabase
                .from('passengers')
                .select('id, first_name, last_name, email, orange_member_number, orange_referral_code, is_orange_member')
                .eq('is_orange_member', true);

            if (membersError) throw membersError;

            // 1a. Fetch ALL Points Ledger entries for Orange members
            const memberIds = membersData?.map((m: any) => m.id) || [];
            let ledgerMap: Record<string, any[]> = {};

            if (memberIds.length > 0) {
                const { data: allLedgerData, error: ledgerFetchError } = await supabase
                    .from('orange_points_ledger')
                    .select('passenger_id, points, status')
                    .in('passenger_id', memberIds);

                if (!ledgerFetchError && allLedgerData) {
                    // Group ledger entries by passenger_id
                    ledgerMap = allLedgerData.reduce((acc: Record<string, any[]>, entry: any) => {
                        if (!acc[entry.passenger_id]) {
                            acc[entry.passenger_id] = [];
                        }
                        acc[entry.passenger_id].push(entry);
                        return acc;
                    }, {});
                } else if (ledgerFetchError) {
                    console.error('Error fetching ledger:', ledgerFetchError);
                }
            }

            // 1b. Fetch Referral Counts (Separate query to avoid 400 error with complex embeddings)
            let referralCountsMap: Record<string, number> = {};

            if (memberIds.length > 0) {
                const { data: referralsData, error: referralsError } = await supabase
                    .from('passengers')
                    .select('referred_by_passenger_id')
                    .in('referred_by_passenger_id', memberIds);

                if (!referralsError && referralsData) {
                    referralCountsMap = referralsData.reduce((acc: Record<string, number>, curr: any) => {
                        const referrerId = curr.referred_by_passenger_id;
                        if (referrerId) {
                            acc[referrerId] = (acc[referrerId] || 0) + 1;
                        }
                        return acc;
                    }, {});
                } else if (referralsError) {
                    console.error('Error fetching referrals:', referralsError);
                }
            }

            // Process members and calculate balances
            const processedMembers = membersData?.map((m: any) => {
                const memberLedger = ledgerMap[m.id] || [];
                const activePoints = memberLedger
                    .filter((l: any) => l.status === 'ACTIVE')
                    .reduce((sum: number, l: any) => sum + l.points, 0);

                return {
                    id: m.id,
                    first_name: m.first_name,
                    last_name: m.last_name,
                    email: m.email,
                    orange_member_number: m.orange_member_number,
                    orange_referral_code: m.orange_referral_code,
                    points_balance: activePoints,
                    referred_count: referralCountsMap[m.id] || 0
                };
            }) || [];

            // Get referred counts (optimized query might be needed for large datasets)
            // For MVP, we can do a quick count if needed, or skip. 
            // Let's skip heavy distinct counting for now to keep it fast.

            setMembers(processedMembers);

            // 2. Fetch Transactions (Recent Ledger Entries)
            const { data: ledgerData, error: ledgerError } = await supabase
                .from('orange_points_ledger')
                .select(`
                    id, points, reason, trip_category, status, created_at, expires_at,
                    passengers!orange_points_ledger_passenger_id_fkey ( first_name, last_name, email ),
                    source_passenger:passengers!orange_points_ledger_source_passenger_id_fkey ( first_name, last_name )
                `)
                .order('created_at', { ascending: false })
                .limit(50); // Limit to recent 50 for performance

            if (ledgerError) throw ledgerError;

            setTransactions(ledgerData?.map((t: any) => ({
                id: t.id,
                passenger: {
                    first_name: t.passengers?.first_name || 'Desconocido',
                    last_name: t.passengers?.last_name || '',
                    email: t.passengers?.email || ''
                },
                source_passenger: t.source_passenger ? {
                    first_name: t.source_passenger.first_name,
                    last_name: t.source_passenger.last_name
                } : null,
                points: t.points,
                reason: t.reason,
                trip_category: t.trip_category,
                status: t.status,
                created_at: t.created_at,
                expires_at: t.expires_at
            })) || []);

            // 3. Calculate Stats
            const totalActivePoints = processedMembers.reduce((sum, m) => sum + m.points_balance, 0);

            // Fetch expiring points count (points expiring in next 30 days)
            const nextMonth = new Date();
            nextMonth.setDate(nextMonth.getDate() + 30);

            const { count: expiringCount } = await supabase
                .from('orange_points_ledger')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'ACTIVE')
                .lt('expires_at', nextMonth.toISOString())
                .gt('expires_at', new Date().toISOString());

            setStats({
                totalPoints: totalActivePoints,
                activeMembers: processedMembers.length,
                expiringPoints: expiringCount || 0
            });

        } catch (error) {
            console.error('Error fetching admin points data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = members.filter(m =>
        m.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.orange_referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Gestión de Puntos</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Administra el programa Orange Pass</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                            <span className="material-symbols-outlined text-2xl">stars</span>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-zinc-800 dark:text-white">{stats.totalPoints.toLocaleString()}</p>
                            <p className="text-sm text-zinc-500">Puntos en Circulación</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <span className="material-symbols-outlined text-2xl">group</span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-zinc-800 dark:text-white">{stats.activeMembers}</p>
                            <p className="text-sm text-zinc-500">Miembros Activos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            <span className="material-symbols-outlined text-2xl">alarm</span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-zinc-800 dark:text-white">{stats.expiringPoints}</p>
                            <p className="text-sm text-zinc-500">Transacciones por Vencer (30d)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                {/* Tabs & Search */}
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'members'
                                ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            Miembros
                        </button>
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'transactions'
                                ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            Transacciones
                        </button>
                        <button
                            onClick={() => setActiveTab('redemptions')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'redemptions'
                                ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            Solicitudes de Canje
                        </button>
                    </div>

                    {activeTab === 'members' && (
                        <div className="relative w-full sm:w-64">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Buscar miembro..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    )}
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <span className="material-symbols-outlined animate-spin text-3xl text-zinc-300">progress_activity</span>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'members' ? (
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 text-left">
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Miembro</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Membresía</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Balance</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Código</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {filteredMembers.map((member) => (
                                            <tr key={member.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                            {member.first_name[0]}{member.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-zinc-800 dark:text-white">{member.first_name} {member.last_name}</p>
                                                            <p className="text-xs text-zinc-500">{member.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-zinc-600 dark:text-zinc-400">
                                                    {member.orange_member_number || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-bold text-primary">{member.points_balance}</span>
                                                    <span className="text-xs text-zinc-400 ml-1">pts</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-xs text-zinc-600 dark:text-zinc-400">
                                                        {member.orange_referral_code || '-'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : activeTab === 'redemptions' ? (
                                <div className="p-6">
                                    <Redemptions />
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 text-left">
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Fecha</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Beneficiario</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Motivo</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Puntos</th>
                                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                                                <td className="px-6 py-4 text-sm text-zinc-500">
                                                    {new Date(tx.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-zinc-800 dark:text-white">
                                                            {tx.passenger.first_name} {tx.passenger.last_name}
                                                        </span>
                                                        <span className="text-xs text-zinc-400">{tx.passenger.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-zinc-800 dark:text-white">
                                                            {tx.reason === 'REFERRAL_PURCHASE' ? 'Referido Compra' : tx.reason}
                                                        </span>
                                                        {tx.source_passenger && (
                                                            <span className="text-xs text-zinc-500">
                                                                De: {tx.source_passenger.first_name} {tx.source_passenger.last_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-bold text-green-600">+{tx.points}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tx.status === 'ACTIVE'
                                                        ? 'bg-green-50 text-green-600 dark:bg-green-900/30'
                                                        : tx.status === 'EXPIRED'
                                                            ? 'bg-red-50 text-red-600 dark:bg-red-900/30'
                                                            : 'bg-zinc-100 text-zinc-600'
                                                        }`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
