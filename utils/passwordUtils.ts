/**
 * Utilidades para validación y gestión de contraseñas
 */

export interface PasswordValidation {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
    score: number; // 0-100
}

// Lista de contraseñas comunes que deben ser rechazadas
const COMMON_PASSWORDS = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
    'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
    'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
    'qazwsx', 'michael', 'football', 'password1', 'admin', 'welcome', 'argentina',
    'buenosaires', 'triex', 'viaje', 'viajes'
];

/**
 * Valida la fortaleza de una contraseña y retorna errores específicos
 */
export const validatePasswordStrength = (password: string): PasswordValidation => {
    const errors: string[] = [];
    let score = 0;

    // Validación de longitud mínima
    if (!password || password.length === 0) {
        return {
            isValid: false,
            errors: ['La contraseña es obligatoria'],
            strength: 'weak',
            score: 0
        };
    }

    if (password.length < 8) {
        errors.push('Debe tener al menos 8 caracteres');
    } else if (password.length >= 8) {
        score += 20;
    }

    if (password.length >= 12) {
        score += 10;
    }

    // Validación de mayúsculas
    if (!/[A-Z]/.test(password)) {
        errors.push('Debe contener al menos una letra mayúscula');
    } else {
        score += 20;
    }

    // Validación de minúsculas
    if (!/[a-z]/.test(password)) {
        errors.push('Debe contener al menos una letra minúscula');
    } else {
        score += 20;
    }

    // Validación de números
    if (!/[0-9]/.test(password)) {
        errors.push('Debe contener al menos un número');
    } else {
        score += 20;
    }

    // Validación de caracteres especiales
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Debe contener al menos un carácter especial (!@#$%^&*, etc.)');
    } else {
        score += 10;
    }

    // Check for common passwords (case-insensitive)
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
        errors.push('Esta contraseña es demasiado común. Elegí una más segura');
        score = Math.min(score, 30); // Cap score for common passwords
    }

    // Check for sequential characters
    if (/(.)\1{2,}/.test(password)) {
        errors.push('Evitá usar el mismo carácter repetido');
        score -= 10;
    }

    // Bonus for variety
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) {
        score += 10;
    }

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong';
    if (score < 40) {
        strength = 'weak';
    } else if (score < 70) {
        strength = 'medium';
    } else {
        strength = 'strong';
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength,
        score
    };
};

/**
 * Get color for password strength indicator
 */
export const getStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
        case 'weak':
            return 'bg-red-500';
        case 'medium':
            return 'bg-yellow-500';
        case 'strong':
            return 'bg-green-500';
    }
};

/**
 * Get text label for password strength
 */
export const getStrengthLabel = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
        case 'weak':
            return 'Débil';
        case 'medium':
            return 'Media';
        case 'strong':
            return 'Fuerte';
    }
};
