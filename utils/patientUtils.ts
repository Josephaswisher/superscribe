/**
 * Generates a deterministic HSL color from a string (e.g., patient name).
 */
export const getPatientColor = (name: string): { bg: string; text: string; border: string } => {
    if (!name || name === 'New Patient') {
        return {
            bg: 'hsl(24, 75%, 50%)',
            text: '#fff',
            border: 'hsl(24, 75%, 40%)'
        };
    }

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use a refined range for healthcare-friendly colors (distinct but professional)
    const h = Math.abs(hash % 360);
    const s = 65 + Math.abs(hash % 20); // 65-85% saturation
    const l = 45 + Math.abs(hash % 10); // 45-55% lightness

    return {
        bg: `hsl(${h}, ${s}%, ${l}%)`,
        text: '#fff',
        border: `hsl(${h}, ${s}%, ${l - 10}%)`
    };
};

/**
 * Extracts initials from a patient name.
 */
export const getInitials = (name: string): string => {
    if (!name || !name.trim()) return '??';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    return (first + last).toUpperCase() || '??';
};
