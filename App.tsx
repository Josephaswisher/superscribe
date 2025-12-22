import { ThemeProvider } from './contexts/ThemeContext';
import { UISettingsProvider } from './contexts/UISettingsContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { ModelProvider } from './contexts/ModelContext';
import { TeamProvider } from './contexts/TeamContext';
import AppContent from './components/Layout/App';
import { MacroProvider } from './contexts/MacroContext';

export default function App() {
  return (
    <ThemeProvider>
      <UISettingsProvider>
        <ModelProvider>
          <DocumentProvider>
            <TeamProvider>
              <MacroProvider>
                <AppContent />
              </MacroProvider>
            </TeamProvider>
          </DocumentProvider>
        </ModelProvider>
      </UISettingsProvider>
    </ThemeProvider>
  );
}
