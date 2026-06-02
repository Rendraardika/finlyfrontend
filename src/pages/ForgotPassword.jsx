import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

import Input from '../components/Input';
import Button from '../components/Button';
import logoFinly from '../assets/logo-finly.svg';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Email wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.forgotPassword(email);
      setSuccess(response.data.message || 'Link reset password telah dikirim ke email kamu.');
      setEmail('');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memproses permintaan. Periksa kembali email kamu.');
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
                Recover<br/>Your Account<br/>Easily.
              </h1>
              <p className="text-[#EAF6ED] text-[15px] leading-relaxed pr-4">
                Don't worry! Enter your registered email address and we'll help you reset your password.
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
              <h2 className="text-[22px] font-bold text-[#1A1A1A] dark:text-white mb-1">Forgot Password?</h2>
              <p className="text-[#666666] dark:text-gray-400 text-[14px]">Enter your email to receive a password reset link.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm text-center">
                {success}
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Tip (Dev Mode): Cek log terminal backend Anda untuk menyalin link reset password.
                </div>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" className="mt-4" isLoading={loading}>
                Send Reset Link
              </Button>
            </form>

            <p className="text-center text-[#666666] dark:text-gray-400 text-[14px] mt-6">
              Remember your password? <Link to="/login" className="text-[#05A845] hover:text-[#048A38] font-bold">Sign In</Link>
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
