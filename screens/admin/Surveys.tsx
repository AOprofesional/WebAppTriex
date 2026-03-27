import React, { useState, useEffect, useRef } from 'react';
import { useAdminSurveys, SurveyRecord, NpsCategory, getNpsCategory } from '../../hooks/useAdminSurveys';
import { useAdminInitialSurveys, InitialSurveyRecord } from '../../hooks/useAdminInitialSurveys';
import { useSurveySettings, SurveySettings } from '../../hooks/useSurveySettings';

// ─── Shared helpers ───────────────────────────────────────────
const NPS_BADGE: Record<NpsCategory, { label: string; className: string }> = {
    promoter: { label: 'Promotor', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    neutral:  { label: 'Neutro',   className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
    detractor:{ label: 'Detractor',className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

const Stars: React.FC<{ value: number | null; max?: number }> = ({ value, max = 5 }) => (
    <span className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, i) => (
            <span key={i} className="material-symbols-outlined text-[16px]"
                style={{ color: i < (value ?? 0) ? '#F59E0B' : '#d1d5db', fontVariationSettings: "'FILL' 1" }}>star</span>
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

const Badge: React.FC<{ text: string; color?: string }> = ({ text, color = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300' }) => (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${color}`}>{text}</span>
);

// ─── Settings Tab ─────────────────────────────────────────────
const SurveySettingsTab: React.FC = () => {
    const { settings, loading, error, updating, updateSettings } = useSurveySettings();
    const [formData, setFormData] = useState<SurveySettings | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => { if (settings && !formData) setFormData(settings); }, [settings, formData]);

    if (loading) return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-2 border-[#E0592A] border-t-transparent rounded-full animate-spin" /></div>;
    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
    if (!formData) return null;

    const handleChange = (field: keyof SurveySettings, value: any) => { setFormData(prev => prev ? { ...prev, [field]: value } : null); setSaved(false); };
    const handleSave = async () => { if (!formData) return; const res = await updateSettings(formData); if (res.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); } };

    const Field: React.FC<{ label: string; field: keyof SurveySettings }> = ({ label, field }) => (
        <div>
            <label className="block text-[13px] font-bold text-zinc-700 dark:text-zinc-300 mb-2">{label}</label>
            <input type="text" value={(formData as any)[field] || ''} onChange={e => handleChange(field, e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#E0592A]/30 focus:border-[#E0592A] transition-all" />
        </div>
    );

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 max-w-3xl">
            <div className="mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-1">Textos de la Encuesta Post-Viaje</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">URL de Google Reviews y textos personalizables.</p>
            </div>
            <div className="space-y-5">
                <Field label="Pregunta 1 (NPS - legado)" field="q1_text" />
                <Field label="Pregunta 2 (Organización - legado)" field="q2_text" />
                <Field label="Pregunta 3 (Atención - legado)" field="q3_text" />
                <Field label="Placeholder del Comentario" field="comment_placeholder" />
                <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="block text-[13px] font-bold text-zinc-700 dark:text-zinc-300 mb-2">URL de Reseña en Google</label>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px] text-zinc-400">link</span>
                        <input type="text" value={formData.google_review_url || ''} onChange={e => handleChange('google_review_url', e.target.value)}
                            placeholder="https://g.page/r/..." className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#E0592A]/30 focus:border-[#E0592A] transition-all" />
                    </div>
                </div>
            </div>
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end items-center gap-4">
                {saved && <span className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">check_circle</span>¡Guardado!</span>}
                <button onClick={handleSave} disabled={updating} className="px-6 py-2.5 bg-[#E0592A] hover:bg-[#F06A3B] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2">
                    {updating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</> : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    );
};

// ─── Post-Trip Detail Modal ────────────────────────────────────
const PostTripDetailModal: React.FC<{ survey: SurveyRecord | null; onClose: () => void }> = ({ survey, onClose }) => {
    if (!survey) return null;
    const isV2 = survey.rating_general !== null;
    const cat = getNpsCategory(survey.nps);
    const badge = NPS_BADGE[cat];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                <div className="bg-gradient-to-br from-[#E0592A] to-[#F97316] px-7 pt-7 pb-5 flex-shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                    <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-1">Encuesta Post-Viaje {isV2 ? 'V2' : 'V1'}</p>
                    <h2 className="text-xl font-extrabold text-white">{survey.passenger_name}</h2>
                    <p className="text-sm text-white/80 mt-0.5">{survey.trip_destination} {survey.trip_internal_code && `· ${survey.trip_internal_code}`}</p>
                </div>
                <div className="overflow-y-auto px-7 py-6 space-y-5">
                    <p className="text-xs text-zinc-400">{new Date(survey.responded_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

                    {isV2 ? (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-center">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Experiencia General</p>
                                    <p className="text-3xl font-extrabold text-yellow-500">{survey.rating_general}</p>
                                    <Stars value={survey.rating_general} />
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-center">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Expectativas Destino</p>
                                    <p className="text-lg font-bold text-zinc-700 dark:text-white mt-2">{survey.destination_expectation ?? '—'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-center">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">¿Volvería a elegirnos?</p>
                                    <p className="text-lg font-bold text-zinc-700 dark:text-white mt-2">{survey.would_buy_again ?? '—'}</p>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-center">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">¿Tuvo incidente?</p>
                                    <p className={`text-lg font-bold mt-2 ${survey.had_incident ? 'text-red-500' : 'text-green-600'}`}>{survey.had_incident === null ? '—' : survey.had_incident ? 'Sí' : 'No'}</p>
                                </div>
                            </div>
                            {survey.incident_comment && (
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-2">Descripción del Incidente</p>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300 bg-red-50 dark:bg-red-900/20 rounded-2xl px-4 py-3">{survey.incident_comment}</p>
                                </div>
                            )}
                            {survey.services_ratings && Object.keys(survey.services_ratings).length > 0 && (
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-3">Evaluación de Servicios</p>
                                    <div className="space-y-2">
                                        {Object.entries(survey.services_ratings).map(([svc, val]) => (
                                            <div key={svc} className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                                <span className="text-sm text-zinc-600 dark:text-zinc-300">{svc}</span>
                                                {val === 'N/A' ? <Badge text="N/A" /> : <Stars value={val as number} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-center">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">NPS</p>
                                    <p className="text-3xl font-extrabold text-zinc-700 dark:text-white">{survey.nps}</p>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-center">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Organización</p>
                                    <Stars value={survey.rating_organization} />
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-center">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Atención</p>
                                    <Stars value={survey.rating_attention} />
                                </div>
                            </div>
                            {survey.comment && <p className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 py-3">"{survey.comment}"</p>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Initial Survey Detail Modal ───────────────────────────────
const InitialDetailModal: React.FC<{ survey: InitialSurveyRecord | null; onClose: () => void }> = ({ survey, onClose }) => {
    if (!survey) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-7 pt-7 pb-5">
                    <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                    <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-1">Encuesta Inicial (Pre-Viaje)</p>
                    <h2 className="text-xl font-extrabold text-white">{survey.passenger_name}</h2>
                    <p className="text-xs text-white/70 mt-1">{new Date(survey.responded_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="px-7 py-6 space-y-5">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-center">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">NPS</p>
                            <p className="text-3xl font-extrabold text-zinc-700 dark:text-white">{survey.nps}</p>
                            <p className="text-[10px] text-zinc-400">/10</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-center">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Atención</p>
                            <Stars value={survey.rating_attention} />
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 text-center">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Facilidad</p>
                            <Stars value={survey.booking_ease} />
                        </div>
                    </div>
                    <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">¿Info clara y completa?</p>
                            <Badge text={survey.info_clear} color={survey.info_clear === 'Sí' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : survey.info_clear === 'Parcialmente' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'} />
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">¿Entendiste lo que buscabas?</p>
                            <Badge text={survey.understood_needs} color={survey.understood_needs === 'Sí totalmente' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'} />
                        </div>
                    </div>
                    {survey.comment && (
                        <>
                            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 py-3">"{survey.comment}"</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Post-Trip Section ─────────────────────────────────────────
const PostTripSection: React.FC = () => {
    const { surveys, stats, loading, error, refetch, filterDateFrom, setFilterDateFrom, filterDateTo, setFilterDateTo, filterSearch, setFilterSearch, filterOnlyDetractors, setFilterOnlyDetractors, sortField, sortDir, toggleSortField } = useAdminSurveys();
    const [activeTab, setActiveTab] = useState<'resumen' | 'listado'>('resumen');
    const [selectedSurvey, setSelectedSurvey] = useState<SurveyRecord | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (tableRef.current && !tableRef.current.contains(e.target as Node)) setOpenDropdownId(null); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const SortIcon: React.FC<{ field: 'responded_at' | 'nps' }> = ({ field }) => {
        if (sortField !== field) return <span className="material-symbols-outlined text-[14px] text-zinc-300">unfold_more</span>;
        return <span className="material-symbols-outlined text-[14px] text-[#E0592A]">{sortDir === 'asc' ? 'expand_less' : 'expand_more'}</span>;
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#E0592A] border-t-transparent rounded-full animate-spin" /></div>;
    if (error) return <div className="text-center py-16"><span className="material-symbols-outlined text-5xl text-red-400 mb-3 block">error</span><p className="text-zinc-500">{error}</p><button onClick={refetch} className="mt-4 px-5 py-2 bg-[#E0592A] text-white rounded-xl text-sm font-bold">Reintentar</button></div>;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Desde</label>
                        <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#E0592A]/30" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Hasta</label>
                        <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#E0592A]/30" />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Buscar</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-zinc-400">search</span>
                            <input type="text" value={filterSearch} onChange={e => setFilterSearch(e.target.value)} placeholder="Pasajero, destino, código…" className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#E0592A]/30 placeholder-zinc-400" />
                        </div>
                    </div>
                    <button onClick={() => setFilterOnlyDetractors(!filterOnlyDetractors)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${filterOnlyDetractors ? 'bg-red-600 border-red-600 text-white' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-red-400 hover:text-red-600'}`}>
                        <span className="material-symbols-outlined text-[18px]">sentiment_dissatisfied</span>Solo detractores
                    </button>
                    {(filterDateFrom || filterDateTo || filterSearch || filterOnlyDetractors) && (
                        <button onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setFilterSearch(''); setFilterOnlyDetractors(false); }} className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-600 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 transition-colors">
                            <span className="material-symbols-outlined text-[16px]">close</span>Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 w-fit">
                {([['resumen','bar_chart','Resumen'],['listado','table_rows','Listado']] as const).map(([id, icon, label]) => (
                    <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === id ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                        <span className="material-symbols-outlined text-[18px]">{icon}</span>{label}
                    </button>
                ))}
            </div>

            {/* Resumen Tab */}
            {activeTab === 'resumen' && (
                <div className="space-y-6">
                    {stats && stats.total > 0 ? (
                        <>
                            <div>
                                <h3 className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Experiencia General</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard label="Exp. General Promedio" value={`${stats.avg_general} / 5`} colorClass="text-yellow-600 dark:text-yellow-400" />
                                    <StatCard label="¿Volvería a elegirnos?" value={`${stats.pct_would_buy_again}%`} colorClass="text-green-600 dark:text-green-400" sub="respondieron Sí" />
                                    <StatCard label="Total Respuestas" value={stats.total} sub="encuestas completadas" />
                                    <StatCard label="Promedio Org. (legacy)" value={`${stats.avg_organization} / 5`} colorClass="text-yellow-600 dark:text-yellow-400" />
                                </div>
                            </div>
                            {Object.keys(stats.avg_services).length > 0 && (
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
                                    <p className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Promedio por Servicio</p>
                                    <div className="space-y-3">
                                        {Object.entries(stats.avg_services).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([svc, avg]) => (
                                            <div key={svc} className="flex items-center gap-3">
                                                <p className="text-sm text-zinc-600 dark:text-zinc-300 w-48 truncate">{svc}</p>
                                                <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#E0592A] rounded-full transition-all" style={{ width: `${((avg as number) / 5) * 100}%` }} />
                                                </div>
                                                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 w-10 text-right">{avg as number}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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

            {/* Listado Tab */}
            {activeTab === 'listado' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    {surveys.length === 0 ? (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-600 mb-4 block">search_off</span>
                            <h3 className="text-lg font-bold text-zinc-400 dark:text-zinc-500 mb-2">Sin resultados</h3>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full" ref={tableRef}>
                                <thead>
                                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                                        <th className="px-5 py-4 text-left"><button onClick={() => toggleSortField('responded_at')} className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider hover:text-zinc-600">Fecha <SortIcon field="responded_at" /></button></th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Pasajero</th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Viaje</th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Exp. General</th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">¿Volvería?</th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Incidente</th>
                                        <th className="px-5 py-4 text-right text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                    {surveys.map(survey => (
                                        <tr key={survey.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                                            <td className="px-5 py-4 text-sm text-zinc-500 whitespace-nowrap">{new Date(survey.responded_at).toLocaleDateString('es-AR')}</td>
                                            <td className="px-5 py-4"><p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{survey.passenger_name}</p></td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 max-w-[160px] truncate">{survey.trip_destination}</p>
                                                {survey.trip_internal_code && <p className="text-[11px] text-zinc-400 font-mono">{survey.trip_internal_code}</p>}
                                            </td>
                                            <td className="px-5 py-4">
                                                {survey.rating_general !== null ? <Stars value={survey.rating_general} /> : <span className="text-xs text-zinc-300 italic">V1</span>}
                                            </td>
                                            <td className="px-5 py-4">
                                                {survey.would_buy_again ? <Badge text={survey.would_buy_again} color={survey.would_buy_again === 'Sí' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'} /> : <span className="text-xs text-zinc-300 italic">—</span>}
                                            </td>
                                            <td className="px-5 py-4">
                                                {survey.had_incident === null ? <span className="text-xs text-zinc-300 italic">—</span> : survey.had_incident ? <Badge text="Sí" color="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" /> : <Badge text="No" color="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" />}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="relative inline-block">
                                                    <button onClick={e => { e.stopPropagation(); setOpenDropdownId(openDropdownId === survey.id ? null : survey.id); }} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                                    </button>
                                                    {openDropdownId === survey.id && (
                                                        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-700 z-50 py-1 overflow-hidden" onClick={e => e.stopPropagation()}>
                                                            <button onClick={() => { setSelectedSurvey(survey); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-medium flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-[18px]">visibility</span>Ver detalle
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}


            <PostTripDetailModal survey={selectedSurvey} onClose={() => setSelectedSurvey(null)} />
        </div>
    );
};

// ─── Initial Survey Section ────────────────────────────────────
const InitialSurveySection: React.FC = () => {
    const { surveys, stats, loading, error, refetch, filterSearch, setFilterSearch, filterDateFrom, setFilterDateFrom, filterDateTo, setFilterDateTo } = useAdminInitialSurveys();
    const [activeTab, setActiveTab] = useState<'resumen' | 'listado'>('resumen');
    const [selectedSurvey, setSelectedSurvey] = useState<InitialSurveyRecord | null>(null);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (error) return <div className="text-center py-16"><span className="material-symbols-outlined text-5xl text-red-400 mb-3 block">error</span><p className="text-zinc-500">{error}</p><button onClick={refetch} className="mt-4 px-5 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold">Reintentar</button></div>;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Desde</label>
                        <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Hasta</label>
                        <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Buscar Pasajero</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-zinc-400">search</span>
                            <input type="text" value={filterSearch} onChange={e => setFilterSearch(e.target.value)} placeholder="Nombre del pasajero…" className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-zinc-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 w-fit">
                {([['resumen','bar_chart','Resumen'],['listado','table_rows','Listado']] as const).map(([id, icon, label]) => (
                    <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === id ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                        <span className="material-symbols-outlined text-[18px]">{icon}</span>{label}
                    </button>
                ))}
            </div>

            {/* Resumen Tab */}
            {activeTab === 'resumen' && (
                <div className="space-y-6">
                    {stats && stats.total > 0 ? (
                        <>
                            {/* Row 1: 4 stat cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Total Respuestas" value={stats.total} sub="encuestas iniciales" />
                                <StatCard label="NPS Promedio" value={stats.avg_nps} sub="sobre 10" colorClass={stats.avg_nps >= 9 ? 'text-green-600' : stats.avg_nps >= 7 ? 'text-yellow-600' : 'text-red-600'} />
                                <StatCard label="Calidad de Atención" value={`${stats.avg_rating_attention} / 5`} colorClass="text-yellow-600 dark:text-yellow-400" sub="Pregunta 1 — escala 1 a 5" />
                                <StatCard label="Facilidad de Compra" value={`${stats.avg_booking_ease} / 5`} colorClass="text-yellow-600 dark:text-yellow-400" sub="Pregunta 4 — escala 1 a 5" />
                            </div>

                            {/* Row 2: NPS distribution */}
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
                                <p className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest mb-4">¿Recomendarías la agencia? (NPS 0-10)</p>
                                <div className="flex rounded-xl overflow-hidden h-8 gap-0.5">
                                    {stats.pct_promoters > 0 && <div className="bg-green-500 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${stats.pct_promoters}%` }}>{stats.pct_promoters}%</div>}
                                    {stats.pct_neutral > 0 && <div className="bg-yellow-400 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${stats.pct_neutral}%` }}>{stats.pct_neutral}%</div>}
                                    {stats.pct_detractors > 0 && <div className="bg-red-400 flex-1 flex items-center justify-center text-white text-xs font-bold">{stats.pct_detractors}%</div>}
                                </div>
                                <div className="flex items-center gap-5 mt-3">
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-xs text-zinc-500">Promotores (9-10) · {stats.pct_promoters}%</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-400" /><span className="text-xs text-zinc-500">Neutrales (7-8) · {stats.pct_neutral}%</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><span className="text-xs text-zinc-500">Detractores (0-6) · {stats.pct_detractors}%</span></div>
                                </div>
                            </div>

                            {/* Row 3: info_clear + understood_needs — full 3-option breakdown */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* ¿Info clara? */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
                                    <p className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest mb-4">¿La información brindada fue clara y completa?</p>
                                    <div className="space-y-3">
                                        {([
                                            { label: 'Sí', pct: stats.pct_info_clear_yes, color: 'bg-green-500' },
                                            { label: 'Parcialmente', pct: stats.pct_info_clear_parcial, color: 'bg-yellow-400' },
                                            { label: 'No', pct: stats.pct_info_clear_no, color: 'bg-red-400' },
                                        ] as const).map(({ label, pct, color }) => (
                                            <div key={label} className="flex items-center gap-3">
                                                <p className="text-sm text-zinc-600 dark:text-zinc-300 w-28">{label}</p>
                                                <div className="flex-1 h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 w-10 text-right">{pct}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ¿Entendió necesidades? */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
                                    <p className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest mb-4">¿El asesor entendió lo que buscabas?</p>
                                    <div className="space-y-3">
                                        {([
                                            { label: 'Sí totalmente', pct: stats.pct_understood_yes, color: 'bg-blue-500' },
                                            { label: 'Más o menos', pct: stats.pct_understood_more_or_less, color: 'bg-yellow-400' },
                                            { label: 'No', pct: stats.pct_understood_no, color: 'bg-red-400' },
                                        ] as const).map(({ label, pct, color }) => (
                                            <div key={label} className="flex items-center gap-3">
                                                <p className="text-sm text-zinc-600 dark:text-zinc-300 w-28">{label}</p>
                                                <div className="flex-1 h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 w-10 text-right">{pct}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-600 mb-4 block">how_to_reg</span>
                            <h3 className="text-lg font-bold text-zinc-400 dark:text-zinc-500 mb-2">Sin encuestas iniciales todavía</h3>
                        </div>
                    )}
                </div>
            )}

            {/* Listado Tab */}
            {activeTab === 'listado' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    {surveys.length === 0 ? (
                        <div className="text-center py-20"><span className="material-symbols-outlined text-6xl text-zinc-300 mb-4 block">search_off</span><p className="text-zinc-400">Sin resultados</p></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Fecha</th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Pasajero</th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">NPS</th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Atención</th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Info Clara</th>
                                        <th className="px-5 py-4 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Entendió</th>
                                        <th className="px-5 py-4 text-right text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                    {surveys.map(s => (
                                        <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                                            <td className="px-5 py-4 text-sm text-zinc-500 whitespace-nowrap">{new Date(s.responded_at).toLocaleDateString('es-AR')}</td>
                                            <td className="px-5 py-4"><p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{s.passenger_name}</p></td>
                                            <td className="px-5 py-4"><span className="text-lg font-extrabold text-zinc-700 dark:text-white">{s.nps}</span><span className="text-xs text-zinc-400 ml-1">/10</span></td>
                                            <td className="px-5 py-4"><Stars value={s.rating_attention} /></td>
                                            <td className="px-5 py-4"><Badge text={s.info_clear} color={s.info_clear === 'Sí' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : s.info_clear === 'Parcialmente' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'} /></td>
                                            <td className="px-5 py-4"><Badge text={s.understood_needs === 'Sí totalmente' ? 'Sí' : s.understood_needs === 'Más o menos' ? 'Más o menos' : 'No'} color={s.understood_needs === 'Sí totalmente' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'} /></td>
                                            <td className="px-5 py-4 text-right">
                                                <button onClick={() => setSelectedSurvey(s)} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <InitialDetailModal survey={selectedSurvey} onClose={() => setSelectedSurvey(null)} />
        </div>
    );
};

// ─── Main Export ───────────────────────────────────────────────
export const AdminSurveys: React.FC = () => {
    const [surveyType, setSurveyType] = useState<'post-trip' | 'initial'>('post-trip');

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Resultados y administración de encuestas</p>
                </div>
            </div>

            {/* Survey Type Switcher */}
            <div className="flex gap-3">
                <button
                    onClick={() => setSurveyType('post-trip')}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${surveyType === 'post-trip' ? 'border-[#E0592A] bg-orange-50 dark:bg-orange-900/20 text-[#E0592A]' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 bg-white dark:bg-zinc-900'}`}
                >
                    <span className="material-symbols-outlined text-[20px]">local_airport</span>
                    Encuesta Post-Viaje
                </button>
                <button
                    onClick={() => setSurveyType('initial')}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${surveyType === 'initial' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 bg-white dark:bg-zinc-900'}`}
                >
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                    Encuesta Inicial (Pre-Viaje)
                </button>
            </div>

            {/* Content */}
            {surveyType === 'post-trip' ? <PostTripSection /> : <InitialSurveySection />}
        </div>
    );
};
