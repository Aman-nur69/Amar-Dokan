// ==============================================================================
// Amar Dokan (আমার দোকান) Error Boundary
// A render crash used to white-screen the register mid-sale. The local data is
// safe in IndexedDB, so the recovery path is simply to re-enter the screen.
// ==============================================================================

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AmarDokan] Unhandled render error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  override render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200 shadow-lg p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4 text-2xl">
            ⚠
          </div>
          <h2 className="text-lg font-black text-slate-900 mb-2">
            স্ক্রিনটি খুলতে সমস্যা হয়েছে
          </h2>
          <p className="text-sm text-slate-600 mb-1">
            আপনার বিক্রি, বাকি ও স্টকের কোনো তথ্য হারায়নি — সব কিছু ডিভাইসেই সংরক্ষিত আছে।
          </p>
          <p className="text-xs text-slate-400 mb-5 font-mono break-words">
            {this.state.error.message}
          </p>
          <div className="flex gap-2">
            <button
              onClick={this.handleReset}
              className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm"
            >
              আবার চেষ্টা করুন
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm"
            >
              অ্যাপ রিলোড দিন
            </button>
          </div>
        </div>
      </div>
    );
  }
}
