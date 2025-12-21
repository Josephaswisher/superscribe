import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
      this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 text-gray-100 p-6">
          <div className="max-w-md w-full bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              An unexpected error occurred while rendering the application. 
              {this.state.error && <span className="block mt-2 font-mono text-xs bg-black/30 p-2 rounded text-red-400 break-words">{this.state.error.message}</span>}
            </p>

            <div className="flex gap-3 justify-center">
              <button 
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 bg-[#d97757] hover:bg-[#c66a4d] text-white rounded-lg font-medium transition-colors shadow-lg shadow-orange-900/20"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-700/50">
                <p className="text-xs text-gray-500">
                    If this persists, please check the console for more details.
                </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}