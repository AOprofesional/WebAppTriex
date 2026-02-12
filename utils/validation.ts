// Validation utilities for forms

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
    if (!email) return { isValid: false, error: 'El email es requerido' };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Formato de email inválido' };
    }

    return { isValid: true };
};

export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
    if (!phone) return { isValid: true }; // Phone is optional

    // Accept formats: +54 9 11 1234-5678, +5491112345678, 01112345678, etc.
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    if (!phoneRegex.test(phone)) {
        return { isValid: false, error: 'El teléfono solo puede contener números, espacios, guiones y paréntesis' };
    }

    // Check minimum length (at least 10 digits for Argentine phones)
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
        return { isValid: false, error: 'El teléfono debe tener al menos 10 dígitos' };
    }

    if (digitsOnly.length > 13) {
        return { isValid: false, error: 'El teléfono no puede tener más de 13 dígitos' };
    }

    return { isValid: true };
};

export const validateCUIL = (cuil: string): { isValid: boolean; error?: string } => {
    if (!cuil) return { isValid: true }; // CUIL is optional

    // CUIL format: XX-XXXXXXXX-X (2 digits, dash, 8 digits, dash, 1 digit)
    const cuilRegex = /^\d{2}-\d{8}-\d{1}$/;
    if (!cuilRegex.test(cuil)) {
        return { isValid: false, error: 'Formato de CUIL inválido (debe ser XX-XXXXXXXX-X)' };
    }

    // Additional validation: verify CUIL check digit
    const cuilDigits = cuil.replace(/-/g, '');
    if (cuilDigits.length !== 11) {
        return { isValid: false, error: 'El CUIL debe tener 11 dígitos' };
    }

    // CUIL check digit algorithm
    const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cuilDigits[i]) * multipliers[i];
    }
    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;

    if (checkDigit !== parseInt(cuilDigits[10])) {
        return { isValid: false, error: 'El CUIL ingresado no es válido (dígito verificador incorrecto)' };
    }

    return { isValid: true };
};

export const validateDocumentNumber = (documentType: string | null, documentNumber: string): { isValid: boolean; error?: string } => {
    if (!documentNumber) return { isValid: true }; // Optional

    if (documentType === 'DNI') {
        // DNI should be only numbers, between 7-8 digits for old DNI, or 8 digits for new
        const dniRegex = /^\d{7,8}$/;
        if (!dniRegex.test(documentNumber)) {
            return { isValid: false, error: 'El DNI debe tener entre 7 y 8 dígitos' };
        }
    }

    return { isValid: true };
};

// Network error detection
export const isNetworkError = (error: any): boolean => {
    if (!error) return false;

    const errorMessage = error.message || error.toString();
    return (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('Network') ||
        errorMessage.includes('network') ||
        errorMessage.includes('NetworkError') ||
        !navigator.onLine
    );
};

// Supabase-specific error messages
export const getErrorMessage = (error: any): string => {
    if (!error) return 'Error desconocido';

    if (isNetworkError(error)) {
        return 'Sin conexión a internet. Verifica tu red y vuelve a intentar.';
    }

    const errorCode = error.code;
    const errorMessage = error.message || error.toString();

    // Supabase specific error codes
    if (errorCode === 'PGRST116') {
        return 'Error de permisos. Contacta al administrador.';
    }

    if (errorCode === '23505') {
        return 'Ya existe un registro con estos datos.';
    }

    if (errorCode === '23503') {
        return 'Error de integridad de datos. Verifica que todos los datos relacionados sean correctos.';
    }

    return errorMessage;
};

/**
 * Formatea CUIL con guiones automáticamente
 */
export const formatCUIL = (cuil: string): string => {
    const cleanCUIL = cuil.replace(/\D/g, '');
    if (cleanCUIL.length <= 2) return cleanCUIL;
    if (cleanCUIL.length <= 10) {
        return `${cleanCUIL.slice(0, 2)}-${cleanCUIL.slice(2)}`;
    }
    return `${cleanCUIL.slice(0, 2)}-${cleanCUIL.slice(2, 10)}-${cleanCUIL.slice(10, 11)}`;
};

/**
 * Valida que la fecha de nacimiento no sea futura
 */
export const validateBirthDate = (birthDate: string): { isValid: boolean; error?: string } => {
    if (!birthDate) return { isValid: true }; // Optional

    const date = new Date(birthDate);
    const today = new Date();

    if (date > today) {
        return {
            isValid: false,
            error: 'La fecha de nacimiento no puede ser futura'
        };
    }

    const age = today.getFullYear() - date.getFullYear();
    if (age < 5) {
        return {
            isValid: false,
            error: 'El pasajero debe tener al menos 5 años'
        };
    }

    if (age > 120) {
        return {
            isValid: false,
            error: 'Por favor verificá la fecha de nacimiento'
        };
    }

    return { isValid: true };
};

/**
 * Obtiene la fecha máxima para el input de fecha de nacimiento (hoy)
 */
export const getMaxBirthDate = (): string => {
    return new Date().toISOString().split('T')[0];
};
