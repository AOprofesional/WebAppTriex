import React, { useState } from 'react';
import { useSurvey, SurveyData } from '../hooks/useSurvey';
import { useSurveySettings } from '../hooks/useSurveySettings';

interface SurveyModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
    passengerId: string;
    onSubmitSuccess?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Star Rating (1-5) for general experience
// ─────────────────────────────────────────────────────────────
const StarRating: React.FC<{ value: number | null; onChange: (v: number) => void }> = ({ value, onChange }) => {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hovered ?? value ?? 0) >= star;
                return (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(null)}
                        className="transition-transform active:scale-90"
                    >
                        <span
                            className="material-symbols-outlined text-[36px] transition-colors"
                            style={{ color: filled ? '#F59E0B' : '#e4e4e7', fontVariationSettings: "'FILL' 1" }}
                        >
                            star
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Service Rating (1-5 + N/A)
// ─────────────────────────────────────────────────────────────
const ServiceRating: React.FC<{
    label: string;
    value: number | 'N/A' | null;
    onChange: (v: number | 'N/A') => void;
}> = ({ label, value, onChange }) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <span className="text-[13.5px] font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
            <div className="flex bg-white dark:bg-zinc-800 p-1 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                {[1, 2, 3, 4, 5].map((num) => (
                    <button
                        key={num}
                        onClick={() => onChange(num)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${value === num
                                ? 'bg-[#E0592A] text-white shadow-md'
                                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                            }`}
                    >
                        {num}
                    </button>
                ))}
                <div className="w-px bg-zinc-200 dark:bg-zinc-700 mx-1 my-1" />
                <button
                    onClick={() => onChange('N/A')}
                    className={`px-3 h-8 rounded-lg text-xs font-semibold transition-all ${value === 'N/A'
                            ? 'bg-zinc-600 text-white shadow-md'
                            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                        }`}
                >
                    N/A
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────
export const SurveyModal: React.FC<SurveyModalProps> = ({
    isOpen,
    onClose,
    tripId,
    passengerId,
    onSubmitSuccess,
}) => {
    const { submitting, error, submitSurvey } = useSurvey(tripId, passengerId);
    const { settings } = useSurveySettings();

    const [screen, setScreen] = useState<'intro' | 'form' | 'success'>('intro');

    // Form State
    const [ratingGeneral, setRatingGeneral] = useState<number | null>(null);
    const [destinationExpectation, setDestinationExpectation] = useState<string | null>(null);
    const [servicesRatings, setServicesRatings] = useState<Record<string, number | 'N/A'>>({});
    const [hadIncident, setHadIncident] = useState<boolean | null>(null);
    const [incidentComment, setIncidentComment] = useState('');
    const [wouldBuyAgain, setWouldBuyAgain] = useState<string | null>(null);

    const SERVICES_LIST = [
        'Asesoramiento previo al viaje',
        'Proceso de compra / gestión',
        'Vuelos',
        'Traslados',
        'Alojamiento',
        'Excursiones / actividades',
        'Asistencia al viajero',
        'Coordinación general del viaje'
    ];

    const isServicesComplete = SERVICES_LIST.every(s => servicesRatings[s] !== undefined);
    
    // We only require common answers. The comment is only required if hadIncident is true.
    const isFormValid =
        ratingGeneral !== null &&
        destinationExpectation !== null &&
        isServicesComplete &&
        hadIncident !== null &&
        (hadIncident ? incidentComment.trim().length > 0 : true) &&
        wouldBuyAgain !== null;

    const handleServiceChange = (service: string, val: number | 'N/A') => {
        setServicesRatings(prev => ({ ...prev, [service]: val }));
    };

    const handleSubmit = async () => {
        if (!isFormValid) return;
        const data: SurveyData = {
            rating_general: ratingGeneral,
            destination_expectation: destinationExpectation,
            services_ratings: servicesRatings,
            had_incident: hadIncident,
            incident_comment: hadIncident ? incidentComment : undefined,
            would_buy_again: wouldBuyAgain,
        };
        const ok = await submitSurvey(data);
        if (ok) {
            setScreen('success');
            onSubmitSuccess?.();
        }
    };

    const handleClose = () => {
        setScreen('intro');
        setRatingGeneral(null);
        setDestinationExpectation(null);
        setServicesRatings({});
        setHadIncident(null);
        setIncidentComment('');
        setWouldBuyAgain(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal panel */}
            <div className="relative w-full max-w-[560px] max-h-[90vh] flex flex-col bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

                {/* ── INTRO SCREEN ── */}
                {screen === 'intro' && (
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                        <div className="w-24 h-24 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-6 shadow-inner">
                            <img src="https://i.imgur.com/4UYsBB4.png" alt="Triex" className="w-12 h-12 object-contain drop-shadow-sm" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-zinc-800 dark:text-white mb-2 leading-tight">
                            ¡Queremos conocer<br/>tu experiencia!
                        </h2>
                        <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm">
                            Respondé esta encuesta rápida y sumá <strong className="text-[#E0592A]">+5 puntos Orange</strong> a tu cuenta. ¡Te lleva menos de 1 minuto!
                        </p>
                        <button
                            onClick={() => setScreen('form')}
                            className="w-full py-4 bg-[#E0592A] hover:bg-[#F06A3B] text-white rounded-[20px] font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-orange-500/20"
                        >
                            Comenzar encuesta
                        </button>
                        <button
                            onClick={handleClose}
                            className="mt-4 text-sm font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            En otro momento
                        </button>
                    </div>
                )}

                {/* ── SUCCESS SCREEN ── */}
                {screen === 'success' && (
                    <div className="p-10 flex flex-col items-center text-center overflow-y-auto max-h-[100%]">
                        <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mb-6 relative">
                            <span className="material-symbols-outlined text-green-500 text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                check_circle
                            </span>
                            {/* Orange badge */}
                            <div className="absolute -bottom-2 -right-2 bg-[#E0592A] text-white text-xs font-bold px-2 py-1 rounded-full shadow-md border-2 border-white dark:border-zinc-900">
                                +5 pts
                            </div>
                        </div>
                        <h2 className="text-2xl font-extrabold text-zinc-800 dark:text-white mb-3">
                            ¡Encuesta enviada!
                        </h2>
                        <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs">
                            Gracias por tu tiempo. Hemos sumado <strong className="text-[#E0592A]">5 Puntos Orange 🍊</strong> a tu cuenta.
                        </p>

                        {(ratingGeneral === 5) && (
                            <a
                                href={settings?.google_review_url || 'https://search.google.com/local/writereview?placeid=ChIJwXXeKAsTvJURmEMy-4eHkcw'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full mb-4 py-4 bg-white border-2 border-zinc-200 dark:border-zinc-700 hover:border-[#E0592A] dark:hover:border-[#E0592A] text-zinc-800 dark:text-white rounded-[20px] font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <img src="https://www.gstatic.com/images/branding/product/1x/gmb_48dp.png" alt="Google" className="w-5 h-5 object-contain" />
                                Dejanos una reseña en Google
                            </a>
                        )}

                        <button
                            onClick={handleClose}
                            className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white rounded-[20px] font-bold transition-all active:scale-[0.98]"
                        >
                            Volver al viaje
                        </button>
                    </div>
                )}

                {/* ── FORM SCREEN ── */}
                {screen === 'form' && (
                    <>
                        {/* Header Fixed */}
                        <div className="flex-none shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-lg font-extrabold text-zinc-800 dark:text-white">Opiná sobre tu viaje</h2>
                                <p className="text-xs text-zinc-500">Completá todos los campos para sumar puntos</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        {/* Scrollable Form Content */}
                        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-8">
                            
                            {/* 1. Experiencia general */}
                            <section>
                                <h3 className="text-[15px] font-bold text-zinc-800 dark:text-zinc-200 mb-3">1. ¿Cómo calificarías tu experiencia general del viaje?</h3>
                                <StarRating value={ratingGeneral} onChange={setRatingGeneral} />
                            </section>

                            {/* 2. Expectativas */}
                            <section>
                                <h3 className="text-[15px] font-bold text-zinc-800 dark:text-zinc-200 mb-3">2. ¿El destino cumplió con tus expectativas?</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['Sí', 'Parcialmente', 'No'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setDestinationExpectation(opt)}
                                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                                                destinationExpectation === opt 
                                                ? 'bg-[#E0592A] text-white border-[#E0592A] shadow-md' 
                                                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* 3. Servicios */}
                            <section>
                                <h3 className="text-[15px] font-bold text-zinc-800 dark:text-zinc-200 mb-2">3. ¿Cómo evaluarías los siguientes servicios?</h3>
                                <p className="text-xs text-zinc-500 mb-4">Calificá con estrellas o marcá "N/A" si no utilizaste el servicio.</p>
                                <div className="space-y-2">
                                    {SERVICES_LIST.map(svc => (
                                        <ServiceRating 
                                            key={svc} 
                                            label={svc} 
                                            value={servicesRatings[svc] ?? null} 
                                            onChange={(v) => handleServiceChange(svc, v)} 
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* 4. Incidentes */}
                            <section>
                                <h3 className="text-[15px] font-bold text-zinc-800 dark:text-zinc-200 mb-3">4. ¿Tuviste algún inconveniente durante el viaje?</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setHadIncident(false); setIncidentComment(''); }}
                                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
                                            hadIncident === false
                                            ? 'bg-zinc-800 text-white border-zinc-800 dark:bg-white dark:text-zinc-900 border-transparent shadow-md' 
                                            : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                        }`}
                                    >
                                        No
                                    </button>
                                    <button
                                        onClick={() => setHadIncident(true)}
                                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
                                            hadIncident === true
                                            ? 'bg-[#E0592A] text-white border-[#E0592A] shadow-md' 
                                            : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                        }`}
                                    >
                                        Sí
                                    </button>
                                </div>
                                {hadIncident && (
                                    <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                        <textarea
                                            value={incidentComment}
                                            onChange={(e) => setIncidentComment(e.target.value.slice(0, 500))}
                                            placeholder="Contanos qué ocurrió..."
                                            rows={3}
                                            className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E0592A]/50 focus:border-[#E0592A] transition-all"
                                        />
                                        <div className="text-right text-[11px] text-zinc-400 mt-1">{incidentComment.length}/500</div>
                                    </div>
                                )}
                            </section>

                            {/* 5. Recompra */}
                            <section>
                                <h3 className="text-[15px] font-bold text-zinc-800 dark:text-zinc-200 mb-3">5. ¿Volverías a elegirnos para otro viaje?</h3>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    {['Sí, definitivamente', 'Tal vez', 'No creo'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setWouldBuyAgain(opt)}
                                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all border ${
                                                wouldBuyAgain === opt 
                                                ? 'bg-[#E0592A] text-white border-[#E0592A] shadow-md' 
                                                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Error display */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-2xl border border-red-100 dark:border-red-800">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Footer / Submit fixed at bottom */}
                        <div className="flex-none shrink-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 p-6 pt-4">
                            <button
                                onClick={handleSubmit}
                                disabled={!isFormValid || submitting}
                                className={`w-full py-4 rounded-[20px] font-bold text-[15px] transition-all flex items-center justify-center gap-2 ${
                                    isFormValid && !submitting
                                    ? 'bg-[#E0592A] hover:bg-[#F06A3B] text-white active:scale-[0.98] shadow-lg shadow-orange-500/20'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                                }`}
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>Enviar encuesta y sumar puntos</>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
