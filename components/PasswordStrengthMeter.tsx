import React from 'react';
import { validatePasswordStrength, getStrengthColor, getStrengthLabel } from '../utils/passwordUtils';

interface PasswordStrengthMeterProps {
    password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
    if (!password) return null;

    const validation = validatePasswordStrength(password);
    const { strength, score, errors } = validation;

    return (
        <div className="space-y-2">
            {/* Strength Bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Fortaleza de contraseña</span>
                    <span className={`font-semibold ${strength === 'strong' ? 'text-green-600 dark:text-green-400' :
                            strength === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                        }`}>
                        {getStrengthLabel(strength)}
                    </span>
                </div>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${getStrengthColor(strength)}`}
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>

            {/* Errors List */}
            {errors.length > 0 && (
                <div className="space-y-1">
                    {errors.map((error, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                            <span className="material-symbols-outlined text-sm mt-0.5">close</span>
                            <span>{error}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Requirements Checklist */}
            {password.length > 0 && (
                <div className="space-y-1">
                    <Requirement met={password.length >= 8} text="Mínimo 8 caracteres" />
                    <Requirement met={/[A-Z]/.test(password)} text="Una letra mayúscula" />
                    <Requirement met={/[a-z]/.test(password)} text="Una letra minúscula" />
                    <Requirement met={/[0-9]/.test(password)} text="Un número" />
                    <Requirement met={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)} text="Un carácter especial" />
                </div>
            )}
        </div>
    );
};

interface RequirementProps {
    met: boolean;
    text: string;
}

const Requirement: React.FC<RequirementProps> = ({ met, text }) => (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600 dark:text-green-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
        <span className="material-symbols-outlined text-sm">
            {met ? 'check_circle' : 'radio_button_unchecked'}
        </span>
        <span>{text}</span>
    </div>
);
