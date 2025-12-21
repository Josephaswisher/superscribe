import React, { useContext } from 'react';
import { ThemeContext } from '../../../contexts/ThemeContext';

interface DataViewWrapperProps {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
}

export const DataViewWrapper: React.FC<DataViewWrapperProps> = ({ title, icon: Icon, children }) => {
    const { isDarkMode } = useContext(ThemeContext);
    return (
        <div className={`p-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
            <div className="flex items-center gap-3 mb-6">
                <Icon className={`w-8 h-8 p-1.5 rounded-lg ${isDarkMode ? 'bg-gray-700 text-accent-primary' : 'bg-gray-200 text-accent-primary'}`} />
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h1>
            </div>
            <div className="space-y-6">{children}</div>
        </div>
    );
};