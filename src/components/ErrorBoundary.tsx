import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
          <div className="max-w-2xl w-full bg-slate-800/50 backdrop-blur-xl border-2 border-red-500/30 rounded-3xl p-8 shadow-2xl">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl"></div>
                <div className="relative bg-red-500/10 p-6 rounded-full border-2 border-red-500/30">
                  <AlertTriangle className="w-16 h-16 text-red-400" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center mb-3 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Oops! Terjadi Kesalahan
            </h1>
            
            {/* Description */}
            <p className="text-slate-400 text-center mb-6">
              Aplikasi mengalami error yang tidak terduga. Jangan khawatir, data Anda aman.
            </p>

            {/* Error Details (Collapsible) */}
            {this.state.error && (
              <details className="mb-6 bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                <summary className="cursor-pointer text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                  Detail Error (untuk developer)
                </summary>
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-mono text-red-400 bg-red-950/30 p-3 rounded-lg overflow-auto">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div className="text-xs font-mono text-slate-400 bg-slate-950/50 p-3 rounded-lg overflow-auto max-h-40">
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-5 h-5" />
                Muat Ulang Aplikasi
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all"
              >
                Kembali ke Beranda
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-slate-500 text-center mt-6">
              Jika masalah terus berlanjut, silakan hubungi admin atau staff support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
