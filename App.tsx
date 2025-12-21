import { ThemeProvider } from './contexts/ThemeContext';
import { UISettingsProvider } from './contexts/UISettingsContext';
import { DocumentProvider } from './contexts/DocumentContext';
import AppContent from './components/Layout/App';
import { MacroProvider } from './contexts/MacroContext';

export default function App() {
  return (
    <ThemeProvider>
      <UISettingsProvider>
        <DocumentProvider>
          <MacroProvider>
            <AppContent />
          </MacroProvider>
        </DocumentProvider>
      </UISettingsProvider>
    </ThemeProvider>
  );
}
