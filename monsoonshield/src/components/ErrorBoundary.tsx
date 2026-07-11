"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Shield } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                <p className="text-sm text-slate-400">
                  MonsoonShield encountered an unexpected error. Don&apos;t worry — your safety data is secure.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left">
                <p className="text-xs text-red-400 font-mono break-all">
                  {this.state.error?.message || "Unknown error"}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Try Again
                </button>
                <a
                  href="tel:112"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
                >
                  Call 112
                </a>
              </div>
              <p className="text-[10px] text-slate-600 flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" />
                Your emergency data remains safe
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
