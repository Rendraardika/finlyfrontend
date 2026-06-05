import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext'; 

import Input from '../components/Input';
import Button from '../components/Button';

import logoFinly from '../assets/logo-finly.svg'; 

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const isGoogleConfigured = import.meta.env.VITE_GOOGLE_CLIENT_ID && 
    !import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('your-google-web-client-id');

  const handleGoogleSuccess = async (credential) => {
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.googleLogin(credential);
      const { data } = response.data;
      login(data.user, data.token, data.onboarding || null);
      
      setTimeout(() => {
        setLoading(false);
        navigate(data.redirect_to || (data.next_step === 'dashboard' ? '/dashboard' : '/onboarding'), { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Login dengan Google gagal.');
      setLoading(false);
    }
  };

  const handleGoogleMockLogin = () => {
    handleGoogleSuccess('mock-google-token');
  };

  useEffect(() => {
    const initGoogleAuth = () => {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!isGoogleConfigured) {
        console.warn('Google Client ID not configured or is placeholder. Falling back to mock Google Sign-In.');
        return;
      }

      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => {
              handleGoogleSuccess(response.credential);
            },
          });

          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            { theme: 'outline', size: 'large', width: '100%' }
          );
        } catch (e) {
          console.error('Google accounts initialize error:', e);
        }
      }
    };

    if (window.google) {
      initGoogleAuth();
    } else {
      const timer = setInterval(() => {
        if (window.google) {
          initGoogleAuth();
          clearInterval(timer);
        }
      }, 500);
      return () => clearInterval(timer);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('Email dan password wajib diisi');
      return;
    }
    
    setLoading(true);
    try {
      const response = await authAPI.login(formData);
      const { data } = response.data;
      login(data.user, data.token, data.onboarding || null);
      
      setTimeout(() => {
        setLoading(false);
        navigate(data.redirect_to || (data.next_step === 'dashboard' ? '/dashboard' : '/onboarding'), { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Cek lagi email dan password kamu.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#111111] flex flex-col font-sans">
      
      {/* Wrapper Utama Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        
        {/* Card Split Screen */}
        <div className="bg-white dark:bg-[#1f2028] rounded-[24px] shadow-sm border border-gray-100 dark:border-[#2e303a] w-full max-w-[900px] flex flex-col md:flex-row overflow-hidden">
          
          {/* Kolom Kiri */}
          <div className="hidden md:flex md:w-[45%] bg-[#05A845] p-10 flex-col justify-center relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-15%] w-48 h-48 rounded-full border-[12px] border-white/10 z-0"></div>
            <div className="absolute bottom-[-5%] right-[-10%] w-40 h-40 rounded-full bg-white/10 z-0"></div>
            <div className="absolute top-[40%] right-10 w-4 h-4 rounded-full bg-white/20 z-0"></div>

            {/* Teks Kolom Kiri */}
            <div className="z-10 mt-[-20px]">
              <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                Smart<br/>Financial<br/>Starts Here.
              </h1>
              <p className="text-[#EAF6ED] text-[15px] leading-relaxed pr-4">
                Create an account to join our community and manage your money better.
              </p>
            </div>
          </div>

          {/* Kolom Kanan */}
          <div className="w-full md:w-[55%] p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-[#1f2028]">
            
            {/* Logo Box */}
            <div className="w-20 h-20 bg-white dark:bg-[#2a2d36] rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-50 dark:border-[#3a3d46] flex items-center justify-center mx-auto mb-6 p-3">
              <img src={logoFinly} alt="Finly Logo" className="w-full h-full object-contain" />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-[22px] font-bold text-[#1A1A1A] dark:text-white mb-1">Hello! Welcome back</h2>
              <p className="text-[#666666] dark:text-gray-400 text-[14px]">Please sign in to continue.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label="Email Address"
                id="email"
                type="email"
                name="email"
                placeholder="name@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <Input
                label="Password"
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <div className="flex items-center justify-between mt-1">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#05A845] border-gray-300 dark:border-[#3a3d46] rounded focus:ring-[#05A845] cursor-pointer"
                  />
                  <span className="ml-2 text-[13px] text-[#666666] dark:text-gray-400 group-hover:text-[#1A1A1A] dark:group-hover:text-gray-200 transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-[13px] text-[#05A845] hover:text-[#048A38] font-semibold transition-colors">
                  Reset Password?
                </Link>
              </div>

              <Button type="submit" className="mt-4" isLoading={loading}>
                Login
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100 dark:border-[#2e303a]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-[#1f2028] text-[#666666] dark:text-gray-400 text-[12px] font-medium lowercase">or</span>
              </div>
            </div>

            <div className="flex justify-center">
              {isGoogleConfigured ? (
                <div id="google-signin-button" className="w-full flex justify-center"></div>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleMockLogin}
                  className="w-full h-12 bg-white dark:bg-[#2a2d36] border border-gray-200 dark:border-[#3a3d46] rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.04] shadow-sm transition-all text-[#1A1A1A] dark:text-white"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-[14px] font-semibold text-[#1A1A1A] dark:text-white">
                    Continue with Google
                  </span>
                </button>
              )}
            </div>

            <p className="text-center text-[#666666] dark:text-gray-400 text-[14px] mt-6">
              Don't have an account? <Link to="/register" className="text-[#05A845] hover:text-[#048A38] font-bold">Create Account</Link>
            </p>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full px-4 sm:px-8 py-6 text-[13px] text-[#666666] dark:text-gray-400 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-100 dark:border-[#2e303a]">
        <p className="font-medium text-center md:text-left">© 2026 Finly. All rights reserved.</p>
        <div className="flex gap-6 font-medium">
          <Link to="/privasi" className="hover:text-[#05A845] transition-colors">Privacy</Link>
          <Link to="/syarat" className="hover:text-[#05A845] transition-colors">Terms</Link>
          <Link to="/kontak" className="hover:text-[#05A845] transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
