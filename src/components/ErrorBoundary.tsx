import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };
  
  private handleGoHome = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-white dark:bg-slate-800 p-2 shadow-lg border-2 border-orange-100 dark:border-slate-700 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Hari Pathshala" className="w-full h-full object-contain" />
          </div>
          
          <h1 className="text-2xl font-bold font-sans text-brown-dark dark:text-white mb-2">
            Something went wrong.
          </h1>
          <p className="text-brown-light dark:text-slate-400 mb-8 max-w-sm">
            We're sorry, but an unexpected error occurred. Please try again.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
            <button
              onClick={this.handleReset}
              className="flex-1 flex items-center justify-center gap-2 bg-saffron text-white py-3 px-6 rounded-xl font-bold shadow-md hover:bg-saffron-dark transition-colors"
            >
              <RefreshCw size={20} />
              Retry
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-brown-dark dark:text-white py-3 px-6 rounded-xl font-bold shadow-sm border border-orange-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Home size={20} />
              Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
