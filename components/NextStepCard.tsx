
import React from 'react';

type NextStepType = 'DOCS' | 'INFO' | 'NONE';

type NextStepCardProps = {
    type: NextStepType;
    title: string;
    detail: string;
    ctaLabel: string | null;
    ctaRoute: string | null;
    onCtaClick?: () => void;
};

const iconMap: Record<NextStepType, string> = {
    DOCS: 'description',
    INFO: 'info',
    NONE: 'check_circle',
};

export const NextStepCard: React.FC<NextStepCardProps> = ({
    type,
    title,
    detail,
    ctaLabel,
    onCtaClick,
}) => {
    const icon = iconMap[type] || iconMap.INFO;

    return (
        <div className="bg-[#3D3935] dark:bg-zinc-900 rounded-[32px] p-7 text-white shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-5 mb-6">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white text-[32px]">{icon}</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-[19px] font-bold leading-tight">{title}</h3>
                    {detail && (
                        <p className="text-[13px] text-zinc-300 mt-1.5 leading-snug">{detail}</p>
                    )}
                </div>
            </div>
            {ctaLabel && onCtaClick && (
                <button
                    onClick={onCtaClick}
                    className="w-full py-[18px] bg-[#E0592A] hover:bg-[#F06A3B] text-white rounded-[20px] font-bold shadow-lg shadow-black/20 transition-all active:scale-[0.98] text-[17px] tracking-tight"
                >
                    {ctaLabel}
                </button>
            )}
        </div>
    );
};
