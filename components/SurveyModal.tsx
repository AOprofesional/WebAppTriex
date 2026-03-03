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
// NPS Scale (0-10) with color gradient
// ─────────────────────────────────────────────────────────────
const NPS_COLORS: Record<number, string> = {
    1: '#ef4444', 2: '#ef4444', 3: '#f97316', 4: '#f97316',
    5: '#f59e0b', 6: '#eab308', 7: '#84cc16', 8: '#22c55e',
    9: '#10b981', 10: '#059669',
};

const NPSScale: React.FC<{ value: number | null; onChange: (v: number) => void }> = ({ value, onChange }) => {
    return (
        <div className="w-full">
            <div className="flex gap-1 justify-between">
                {Array.from({ length: 10 }, (_, i) => {
                    const val = i + 1;
                    return (
                        <button
                            key={val}
                            type="button"
                            onClick={() => onChange(val)}
                            className={`flex-1 h-10 rounded-lg text-sm font-bold transition-all active:scale-95 ${value === val
                                ? 'text-white shadow-lg scale-105'
                                : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                                }`}
                            style={value === val ? { backgroundColor: NPS_COLORS[val] } : {}}
                        >
                            {val}
                        </button>
                    );
                })}
            </div>
            <div className="flex justify-between mt-2">
                <span className="text-[11px] text-zinc-400 font-medium">Nada probable</span>
                <span className="text-[11px] text-zinc-400 font-medium">Totalmente probable</span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Star Rating (1-5)
// ─────────────────────────────────────────────────────────────
const StarRating: React.FC<{ value: number | null; onChange: (v: number) => void; label: string }> = ({ value, onChange, label }) => {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div>
            <p className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{label}</p>
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
                                className="material-symbols-outlined text-[32px] transition-colors"
                                style={{ color: filled ? '#F59E0B' : '#d1d5db', fontVariationSettings: "'FILL' 1" }}
                            >
                                star
                            </span>
                        </button>
                    );
                })}
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
    const { settings, loading } = useSurveySettings();

    const [screen, setScreen] = useState<'form' | 'success'>('form');
    const [nps, setNps] = useState<number | null>(null);
    const [orgRating, setOrgRating] = useState<number | null>(null);
    const [attRating, setAttRating] = useState<number | null>(null);
    const [comment, setComment] = useState('');

    const isFormValid = nps !== null && orgRating !== null && attRating !== null;

    const handleSubmit = async () => {
        if (!isFormValid) return;
        const data: SurveyData = {
            nps: nps!,
            rating_organization: orgRating!,
            rating_attention: attRating!,
            comment: comment.trim() || undefined,
        };
        const ok = await submitSurvey(data);
        if (ok) {
            setScreen('success');
            onSubmitSuccess?.();
        }
    };

    const handleClose = () => {
        setScreen('form');
        setNps(null);
        setOrgRating(null);
        setAttRating(null);
        setComment('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal panel */}
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

                {/* ── SUCCESS STATE ── */}
                {screen === 'success' && (
                    <div className="p-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-5">
                            <span className="material-symbols-outlined text-green-500 text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                check_circle
                            </span>
                        </div>
                        <h2 className="text-2xl font-extrabold text-zinc-800 dark:text-white mb-3">
                            ¡Gracias por tu respuesta! 🙌
                        </h2>
                        <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs">
                            Tu opinión nos ayuda a mejorar cada experiencia.
                        </p>

                        {(nps !== null && nps >= 8) && (
                            <a
                                href={settings?.google_review_url || 'https://g.page/r/placeholder/review'}
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
                            className="w-full py-4 bg-[#E0592A] hover:bg-[#F06A3B] text-white rounded-[20px] font-bold transition-all active:scale-[0.98]"
                        >
                            Volver al inicio
                        </button>
                    </div>
                )}

                {/* ── FORM STATE ── */}
                {screen === 'form' && (
                    <>
                        {/* Header */}
                        <div className="relative bg-gradient-to-br from-[#E0592A] to-[#F97316] px-8 pt-8 pb-6">
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                            <h2 className="text-xl font-extrabold text-white mb-1">
                                ¡Gracias por viajar con nosotros! 🙌
                            </h2>
                            <p className="text-[13px] text-white/80">
                                Tu experiencia nos ayuda a mejorar. Te toma menos de 1 minuto.
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />

                        {/* Questions */}
                        <div className="px-8 py-6 space-y-7 max-h-[65vh] overflow-y-auto">

                            {/* Q1 — NPS */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[#E0592A]/10 text-[#E0592A] text-[11px] font-bold flex items-center justify-center">1</span>
                                    <p className="text-[14px] font-semibold text-zinc-700 dark:text-zinc-200">
                                        {settings?.q1_text || '¿Qué tan probable es que nos recomiendes?'}
                                        <span className="text-[#E0592A] ml-1">*</span>
                                    </p>
                                </div>
                                <NPSScale value={nps} onChange={setNps} />
                            </div>

                            {/* Thin separator */}
                            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                            {/* Q2 — Organization */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-6 h-6 rounded-full bg-[#E0592A]/10 text-[#E0592A] text-[11px] font-bold flex items-center justify-center">2</span>
                                    <p className="text-[14px] font-semibold text-zinc-700 dark:text-zinc-200">
                                        {settings?.q2_text || '¿Cómo calificarías la organización general del viaje?'}
                                        <span className="text-[#E0592A] ml-1">*</span>
                                    </p>
                                </div>
                                <StarRating value={orgRating} onChange={setOrgRating} label="" />
                            </div>

                            {/* Thin separator */}
                            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                            {/* Q3 — Attention */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-6 h-6 rounded-full bg-[#E0592A]/10 text-[#E0592A] text-[11px] font-bold flex items-center justify-center">3</span>
                                    <p className="text-[14px] font-semibold text-zinc-700 dark:text-zinc-200">
                                        {settings?.q3_text || '¿Cómo fue la atención del equipo?'}
                                        <span className="text-[#E0592A] ml-1">*</span>
                                    </p>
                                </div>
                                <StarRating value={attRating} onChange={setAttRating} label="" />
                            </div>

                            {/* Thin separator */}
                            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                            {/* Q4 — Comment (optional) */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-[11px] font-bold flex items-center justify-center">4</span>
                                    <p className="text-[14px] font-semibold text-zinc-700 dark:text-zinc-200">
                                        Comentario
                                        <span className="text-zinc-400 text-[12px] ml-2 font-normal">(opcional)</span>
                                    </p>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value.slice(0, 500))}
                                        rows={3}
                                        placeholder={settings?.comment_placeholder || 'Si querés, contanos qué fue lo mejor o qué podríamos mejorar…'}
                                        className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-[#E0592A]/30 focus:border-[#E0592A] transition-all placeholder-zinc-400"
                                    />
                                    <span className="absolute bottom-2 right-3 text-[11px] text-zinc-400">
                                        {comment.length}/500
                                    </span>
                                </div>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-[13px]">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="px-8 pb-8">
                            <button
                                onClick={handleSubmit}
                                disabled={!isFormValid || submitting}
                                className={`w-full py-4 rounded-[20px] font-bold text-[15px] transition-all flex items-center justify-center gap-2 ${isFormValid && !submitting
                                    ? 'bg-[#E0592A] hover:bg-[#F06A3B] text-white active:scale-[0.98]'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                                    }`}
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">send</span>
                                        Enviar respuesta
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
