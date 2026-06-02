import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-white dark:bg-[#0d0d12]">
          <div className="w-full max-w-md text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
              <AlertTriangle size={40} className="text-red-500" />
            </div>

            {/* Error Title */}
            <h1 className="text-[24px] font-bold text-gray-900 dark:text-white mb-2">
              Terjadi Kesalahan
            </h1>

            {/* Error Message */}
            <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-6">
              Aplikasi mengalami masalah. Silakan coba muat ulang halaman atau hubungi support jika masalah terus berlanjut.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#05A845] text-white font-semibold rounded-xl hover:bg-[#048A38] transition-colors"
              >
                <RotateCcw size={18} />
                Muat Ulang
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
              >
                Kembali ke Dashboard
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={this.handleReset}
                className="mt-4 text-[12px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
              >
                Reset Error Boundary
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
