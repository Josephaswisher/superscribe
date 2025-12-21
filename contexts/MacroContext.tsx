import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface Macro {
    id: string;
    key: string; // e.g., ".norm"
    value: string; // The text to expand to
}

interface MacroContextType {
    macros: Macro[];
    addMacro: (key: string, value: string) => void;
    updateMacro: (id: string, key: string, value: string) => void;
    deleteMacro: (id: string) => void;
    expandMacros: (text: string) => string;
}

export const MacroContext = createContext<MacroContextType>(null!);

const DEFAULT_MACROS: Macro[] = [
    { id: '1', key: '.norm', value: 'Constitutional: Negative for fever, chills. Eyes: PERRL. ENT: MMM. CV: RRR, no m/r/g. Resp: CTAB, no w/r/r. GI: Soft, NT/ND. Ext: No edema. Neuro: A&Ox3, non-focal.' },
    { id: '2', key: '.ros', value: 'Negative for CP, SOB, N/V/D, abd pain, HA, dizziness.' },
    { id: '3', key: '.aki', value: '# AKI\n- Stop nephrotoxins\n- IVF @ 100cc/hr\n- Monitor UOP\n- Renal US if no improvement' },
    { id: '4', key: '.sepsis', value: '# Sepsis\n- Blood cultures x2\n- Broad spectrum abx (Vanc/Zosyn)\n- 30cc/kg bolus\n- Trend lactate' },
    { id: '5', key: '.afib', value: '# Atrial Fibrillation\n- Rate control (Metoprolol/Diltiazem)\n- Anticoagulation (Eliquis/Heparin)\n- Rate vs Rhythm strategy' }
];

export const MacroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [macros, setMacros] = useState<Macro[]>(() => {
        try {
            const saved = localStorage.getItem('superscribe_macros');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
            return DEFAULT_MACROS;
        } catch {
            return DEFAULT_MACROS;
        }
    });

    useEffect(() => {
        localStorage.setItem('superscribe_macros', JSON.stringify(macros));
    }, [macros]);

    const addMacro = useCallback((key: string, value: string) => {
        const newMacro: Macro = { id: Date.now().toString(), key, value };
        setMacros(prev => [...prev, newMacro]);
    }, []);

    const updateMacro = useCallback((id: string, key: string, value: string) => {
        setMacros(prev => prev.map(m => m.id === id ? { ...m, key, value } : m));
    }, []);

    const deleteMacro = useCallback((id: string) => {
        setMacros(prev => prev.filter(m => m.id !== id));
    }, []);

    const expandMacros = useCallback((text: string) => {
        let newText = text;
        macros.forEach(({ key, value }) => {
            // Check for space or newline to trigger expansion
            if (newText.endsWith(key + ' ')) {
                newText = newText.slice(0, -(key.length + 1)) + value + ' ';
            } else if (newText.endsWith(key + '\n')) {
                newText = newText.slice(0, -(key.length + 1)) + value + '\n';
            }
        });
        return newText;
    }, [macros]);
    
    const value = useMemo(() => ({
        macros,
        addMacro,
        updateMacro,
        deleteMacro,
        expandMacros
    }), [macros, addMacro, updateMacro, deleteMacro, expandMacros]);

    return (
        <MacroContext.Provider value={value}>
            {children}
        </MacroContext.Provider>
    );
};
