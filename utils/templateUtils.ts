import {
    extractVitalsFromLines,
    getDynamicPreambleHeader,
    extractNameFromHeader,
    extractAdmissionDate,
} from './documentUtils';

export const processTemplate = (
    template: string,
    patientLines: string[],
    header: string
): string => {
    // Extract Data context
    const { name, room, age, gender } = extractNameFromHeader(header);
    const vitalsData = extractVitalsFromLines(patientLines);

    // Problems (Active diagnoses)
    const problems = patientLines
        .filter(l => l.trim().startsWith('#'))
        .map(l => {
            let text = l.trim().replace(/^#+/, '');
            if (text.includes(':')) {
                text = text.split(':')[0];
            }
            return text.trim();
        })
        .filter(p => p.length > 0 && p.length < 60)
        .join(', ');

    // Replacements Map
    const replacements: Record<string, string> = {
        '{{name}}': name || 'Unknown Patient',
        '{{room}}': room || '',
        '{{age}}': age || '',
        '{{gender}}': gender || '',
        '{{vitals}}': vitalsData?.text || 'No vitals recorded',
        '{{vitals.bp}}': vitalsData?.bp || '',
        '{{vitals.hr}}': vitalsData?.hr || '',
        '{{vitals.temp}}': vitalsData?.temp || '',
        '{{vitals.o2}}': vitalsData?.o2 || '',
        '{{problems}}': problems || '',
        '{{date}}': new Date().toLocaleDateString(),
        '{{time}}': new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    let processed = template;

    // Execute replacements
    Object.keys(replacements).forEach(key => {
        // Global replace for all instances
        const regex = new RegExp(key, 'g');
        processed = processed.replace(regex, replacements[key]);
    });

    return processed;
};
