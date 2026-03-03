import React, { useState, useEffect, useRef } from 'react';
import { useAdminSurveys, getNpsCategory, SurveyRecord, NpsCategory } from '../../hooks/useAdminSurveys';
import { useSurveySettings, SurveySettings } from '../../hooks/useSurveySettings';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const NPS_BADGE: Record<NpsCategory, { label: string; className: string }> = {
    promoter: { label: 'Promotor', className: 'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-400' },
    neutral: { label: 'Neutro', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
    detractor: { label: 'Detractor', className: 'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-400' },
};

const Stars: React.FC<{ value: number; max?: number }> = ({ value, max = 5 }) => (
    <span className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, i) => (
            <span
                key={i}
                className="material-symbols-outlined text-[16px]"
                style={{ color: i < value ? '#F59E0B' : '#d1d5db', fontVariationSettings: "'FILL' 1" }}
            >
                star
            </span>
        ))}
    </span>
);

const StatCard: React.FC<{ label: string; value: string | number; sub?: string; colorClass?: string }> = ({
    label, value, sub, colorClass = 'text-zinc-800 dark:text-white',
}) => (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{label}</p>
        <p className={`text-3xl font-extrabold ${colorClass}`}>{value}</p>
        {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
);

// ─────────────────────────────────────────────────────────────
// Detail Modal
// ─────────────────────────────────────────────────────────────
const SurveyDetailModal: React.FC<{ survey: SurveyRecord | null; onClose: () => void }> = ({ survey, onClose }) => {
    if (!survey) return null;
    const cat = getNpsCategory(survey.nps);
    const badge = NPS_BADGE[cat];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#E0592A] to-[#F97316] px-7 pt-7 pb-5">
                    <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                    <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-1">Encuesta</p>
                    <h2 className="text-xl font-extrabold text-white">{survey.passenger_name}</h2>
                    <p className="text-sm text-white/80 mt-0.5">{survey.trip_destination}</p>
                </div>

                {/* Body */}
                <div className="px-7 py-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Fecha de respuesta</p>
                            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                                {new Date(survey.responded_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <span className={`text-[12px] font-bold px-3 py-1.5 rounded-full ${badge.className}`}>{badge.label}</span>
                    </div>

                    <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-center">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">NPS</p>
                            <p className="text-3xl font-extrabold text-zinc-700 dark:text-white">{survey.nps}</p>
                            <p className="text-[10px] text-zinc-400">/10</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-center">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Organización</p>
                            <p className="text-2xl font-extrabold text-yellow-500">{survey.rating_organization}</p>
                            <Stars value={survey.rating_organization} />
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-center">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Atención</p>
                            <p className="text-2xl font-extrabold text-yellow-500">{survey.rating_attention}</p>
                            <Stars value={survey.rating_attention} />
                        </div>
                    </div>

                    {survey.comment && (
                        <>
                            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
                            <div>
                                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-2">Comentario</p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 py-3">
                                    "{survey.comment}"
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Settings Tab Component
// ─────────────────────────────────────────────────────────────
const SurveySettingsTab: React.FC = () => {
    const { settings, loading, error, updating, updateSettings } = useSurveySettings();
    const [formData, setFormData] = useState<SurveySettings | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (settings && !formData) {
            setFormData(settings);
        }
    }, [settings, formData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-2 border-[#E0592A] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
    if (!formData) return null;

    const handleChange = (field: keyof SurveySettings, value: any) => {
        setFormData(prev => prev ? { ...prev, [field]: value } : null);
        setSaved(false);
    };

    const handleSave = async () => {
        if (!formData) return;
        const res = await updateSettings(formData);
        if (res.success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 max-w-3xl">
            <div className="mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-1">Textos de la Encuesta</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Personalizá las preguntas que los pasajeros verán al finalizar su viaje.</p>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="block text-[13px] font-bold text-zinc-700 dark:text-zinc-300 mb-2">Pregunta 1 (NPS)</label>
                    <input
                        type="text"
                        value={formData.q1_text}
                        onChange={e => handleChange('q1_text', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#E0592A]/30 focus:border-[#E0592A] transition-all"
                    />
                </div>
                <div>
                    <label className="block text-[13px] font-bold text-zinc-700 dark:text-zinc-300 mb-2">Pregunta 2 (Organización)</label>
                    <input
                        type="text"
                        value={formData.q2_text}
                        onChange={e => handleChange('q2_text', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#E0592A]/30 focus:border-[#E0592A] transition-all"
                    />
                </div>
                <div>
                    <label className="block text-[13px] font-bold text-zinc-700 dark:text-zinc-300 mb-2">Pregunta 3 (Atención)</label>
                    <input
                        type="text"
                        value={formData.q3_text}
                        onChange={e => handleChange('q3_text', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#E0592A]/30 focus:border-[#E0592A] transition-all"
                    />
                </div>
                <div>
                    <label className="block text-[13px] font-bold text-zinc-700 dark:text-zinc-300 mb-2">Placeholder del Comentario</label>
                    <input
                        type="text"
                        value={formData.comment_placeholder}
                        onChange={e => handleChange('comment_placeholder', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#E0592A]/30 focus:border-[#E0592A] transition-all"
                    />
                </div>
                <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="block text-[13px] font-bold text-zinc-700 dark:text-zinc-300 mb-2">URL de Reseña en Google</label>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px] text-zinc-400">link</span>
                        <input
                            type="text"
                            value={formData.google_review_url || ''}
                            onChange={e => handleChange('google_review_url', e.target.value)}
                            placeholder="https://g.page/r/..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#E0592A]/30 focus:border-[#E0592A] transition-all"
                        />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 ml-8">Esta URL aparecerá como un botón únicamente para pasajeros clasificados como <strong>Promotores</strong> (NPS 8 a 10).</p>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end items-center gap-4">
                {saved && (
                    <span className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1 animate-in fade-in duration-300">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        ¡Guardado!
                    </span>
                )}
                <button
                    onClick={handleSave}
                    disabled={updating}
                    className="px-6 py-2.5 bg-[#E0592A] hover:bg-[#F06A3B] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {updating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        'Guardar Cambios'
                    )}
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────
export const AdminSurveys: React.FC = () => {
    const {
        surveys, stats, loading, error, refetch,
        filterDateFrom, setFilterDateFrom,
        filterDateTo, setFilterDateTo,
        filterSearch, setFilterSearch,
        filterOnlyDetractors, setFilterOnlyDetractors,
        sortField, sortDir, toggleSortField,
    } = useAdminSurveys();

    const [activeTab, setActiveTab] = useState<'resumen' | 'listado' | 'configuracion'>('resumen');
    const [selectedSurvey, setSelectedSurvey] = useState<SurveyRecord | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const tabs = [
        { id: 'resumen' as const, label: 'Resumen', icon: 'bar_chart' },
        { id: 'listado' as const, label: 'Listado', icon: 'table_rows' },
        { id: 'configuracion' as const, label: 'Configuración', icon: 'settings' },
    ];

    const SortIcon: React.FC<{ field: 'responded_at' | 'nps' }> = ({ field }) => {
        if (sortField !== field) return <span className="material-symbols-outlined text-[14px] text-zinc-300">unfold_more</span>;
        return (
            <span className="material-symbols-outlined text-[14px] text-[#E0592A]">
                {sortDir === 'asc' ? 'expand_less' : 'expand_more'}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[#E0592A] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16">
                <span className="material-symbols-outlined text-5xl text-red-400 mb-3 block">error</span>
                <p className="text-zinc-500 dark:text-zinc-400">{error}</p>
                <button onClick={refetch} className="mt-4 px-5 py-2 bg-[#E0592A] text-white rounded-xl text-sm font-bold">Reintentar</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Page Title Row */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {stats?.total ?? 0} encuesta{(stats?.total ?? 0) !== 1 ? 's' : ''} recibida{(stats?.total ?? 0) !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={refetch}
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
                    title="Actualizar"
                >
                    <span className="material-symbols-outlined text-[20px]">refresh</span>
                </button>
            </div>

            {/* ── Filters ── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Desde</label>
                        <input
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => setFilterDateFrom(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#E0592A]/30"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Hasta</label>
                        <input
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => setFilterDateTo(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#E0592A]/30"
                        />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Buscar</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-zinc-400">search</span>
                            <input
                                type="text"
                                value={filterSearch}
                                onChange={(e) => setFilterSearch(e.target.value)}
                                placeholder="Pasajero, destino, código…"
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#E0592A]/30 placeholder-zinc-400"
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => setFilterOnlyDetractors(!filterOnlyDetractors)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${filterOnlyDetractors
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-red-400 hover:text-red-600'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">sentiment_dissatisfied</span>
                        Solo detractores
                    </button>
                    {(filterDateFrom || filterDateTo || filterSearch || filterOnlyDetractors) && (
                        <button
                            onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setFilterSearch(''); setFilterOnlyDetractors(false); }}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* ── Tab Switcher ── */}
            <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id
                            ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white shadow-sm'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: RESUMEN ── */}
            {activeTab === 'resumen' && (
                <div className="space-y-6">
                    {stats && stats.total > 0 ? (
                        <>
                            {/* NPS Row */}
                            <div>
                                <h3 className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Net Promoter Score</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard
                                        label="NPS Promedio"
                                        value={stats.avg_nps.toFixed(1)}
                                        sub="sobre 10 puntos"
                                        colorClass={stats.avg_nps >= 9 ? 'text-green-600' : stats.avg_nps >= 7 ? 'text-yellow-600' : 'text-red-600'}
                                    />
                                    <StatCard label="Promotores (9–10)" value={`${stats.pct_promoters}%`} colorClass="text-green-600 dark:text-green-400" />
                                    <StatCard label="Neutros (7–8)" value={`${stats.pct_neutral}%`} colorClass="text-yellow-600 dark:text-yellow-400" />
                                    <StatCard label="Detractores (0–6)" value={`${stats.pct_detractors}%`} colorClass="text-red-600 dark:text-red-400" />
                                </div>
                            </div>

                            {/* Ratings Row */}
                            <div>
                                <h3 className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Valoraciones</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    <StatCard label="Promedio Organización" value={`${stats.avg_organization.toFixed(1)} / 5`} colorClass="text-yellow-600 dark:text-yellow-400" />
                                    <StatCard label="Promedio Atención" value={`${stats.avg_attention.toFixed(1)} / 5`} colorClass="text-yellow-600 dark:text-yellow-400" />
                                    <StatCard label="Total Encuestas" value={stats.total} sub="respuestas recibidas" />
                                </div>
                            </div>

                            {/* Visual NPS bar */}
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
                                <p className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Distribución NPS</p>
                                <div className="flex rounded-xl overflow-hidden h-8 gap-0.5">
                                    {stats.pct_promoters > 0 && (
                                        <div
                                            className="bg-green-500 flex items-center justify-center text-white text-xs font-bold transition-all"
                                            style={{ width: `${stats.pct_promoters}%` }}
                                        >
                                            {stats.pct_promoters}%
                                        </div>
                                    )}
                                    {stats.pct_neutral > 0 && (
                                        <div
                                            className="bg-yellow-400 flex items-center justify-center text-white text-xs font-bold"
                                            style={{ width: `${stats.pct_neutral}%` }}
                                        >
                                            {stats.pct_neutral}%
                                        </div>
                                    )}
                                    {stats.pct_detractors > 0 && (
                                        <div
                                            className="bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                                            style={{ width: `${stats.pct_detractors}%` }}
                                        >
                                            {stats.pct_detractors}%
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-5 mt-3">
                                    {[
                                        { label: 'Promotores', color: 'bg-green-500' },
                                        { label: 'Neutros', color: 'bg-yellow-400' },
                                        { label: 'Detractores', color: 'bg-red-500' },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-600 mb-4 block">sentiment_satisfied</span>
                            <h3 className="text-lg font-bold text-zinc-400 dark:text-zinc-500 mb-2">Sin encuestas todavía</h3>
                            <p className="text-sm text-zinc-400 dark:text-zinc-500">Las respuestas aparecerán aquí cuando los pasajeros completen sus encuestas.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: LISTADO ── */}
            {activeTab === 'listado' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    {surveys.length === 0 ? (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-600 mb-4 block">search_off</span>
                            <h3 className="text-lg font-bold text-zinc-400 dark:text-zinc-500 mb-2">Sin resultados</h3>
                            <p className="text-sm text-zinc-400 dark:text-zinc-500">Probá ajustando los filtros.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full" ref={tableRef}>
                                <thead>
                                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                                        <th className="px-5 py-4 text-left">
                                            <button
                                                onClick={() => toggleSortField('responded_at')}
                                                className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider hover:text-zinc-600 dark:hover:text-zinc-300"
                                            >
                                                Fecha <SortIcon field="responded_at" />
                                            </button>
                                        </th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Pasajero</th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Viaje</th>
                                        <th className="px-5 py-4 text-left">
                                            <button
                                                onClick={() => toggleSortField('nps')}
                                                className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider hover:text-zinc-600 dark:hover:text-zinc-300"
                                            >
                                                NPS <SortIcon field="nps" />
                                            </button>
                                        </th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Org.</th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Atención</th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Comentario</th>
                                        <th className="px-5 py-4 text-right text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                    {surveys.map((survey) => {
                                        const cat = getNpsCategory(survey.nps);
                                        const badge = NPS_BADGE[cat];
                                        return (
                                            <tr
                                                key={survey.id}
                                                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                                            >
                                                <td className="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                                                    {new Date(survey.responded_at).toLocaleDateString('es-AR')}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{survey.passenger_name}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 max-w-[160px] truncate">{survey.trip_destination}</p>
                                                    {survey.trip_internal_code && (
                                                        <p className="text-[11px] text-zinc-400 font-mono">{survey.trip_internal_code}</p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-extrabold text-zinc-700 dark:text-white">{survey.nps}</span>
                                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>
                                                            {badge.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Stars value={survey.rating_organization} />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Stars value={survey.rating_attention} />
                                                </td>
                                                <td className="px-5 py-4 max-w-[200px]">
                                                    {survey.comment ? (
                                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate" title={survey.comment}>
                                                            {survey.comment.slice(0, 80)}{survey.comment.length > 80 ? '…' : ''}
                                                        </p>
                                                    ) : (
                                                        <span className="text-xs text-zinc-300 dark:text-zinc-600 italic">Sin comentario</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="relative inline-block text-left">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenDropdownId(openDropdownId === survey.id ? null : survey.id);
                                                            }}
                                                            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                                            title="Acciones"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                                        </button>

                                                        {openDropdownId === survey.id && (
                                                            <div
                                                                className="absolute right-0 mt-1 w-36 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-700 z-50 py-1 overflow-hidden"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedSurvey(survey);
                                                                        setOpenDropdownId(null);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-medium flex items-center gap-2 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                                    Ver detalle
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: CONFIGURACIÓN ── */}
            {activeTab === 'configuracion' && <SurveySettingsTab />}

            {/* Detail Modal */}
            <SurveyDetailModal survey={selectedSurvey} onClose={() => setSelectedSurvey(null)} />
        </div>
    );
};
