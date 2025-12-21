import React, { useMemo, useContext } from 'react';
import { ListTodo } from 'lucide-react';
import { extractPlansFromContent } from '../../../utils/documentUtils';
import { DataViewWrapper } from './DataViewWrapper';
import { PatientDataSection } from './PatientDataSection';
import { ThemeContext } from '../../../contexts/ThemeContext';

interface PlanViewProps {
    content: string;
}

export const PlanView: React.FC<PlanViewProps> = ({ content }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const plans = useMemo(() => extractPlansFromContent(content), [content]);
    return (
        <DataViewWrapper title="Plan-Only View" icon={ListTodo}>
            {plans.map(p => (
                <PatientDataSection key={p.patientIndex} header={p.patientHeader}>
                    {p.problems.map((prob, i) => (
                        <div key={i} className="mb-3 last:mb-0">
                            <p className={`font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>{prob.title}</p>
                            <div className="mt-1 space-y-1 text-xs">
                                {prob.details.map((d, j) => <p key={j}>{d}</p>)}
                            </div>
                        </div>
                    ))}
                </PatientDataSection>
            ))}
        </DataViewWrapper>
    );
};