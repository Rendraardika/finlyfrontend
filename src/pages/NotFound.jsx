import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-[#161616] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-[64px] md:text-[80px] font-bold text-[#05A845] mb-4">404</div>
        <h1 className="text-[24px] md:text-[28px] font-bold text-[#1A1A1A] dark:text-white mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-[14px] md:text-[16px] text-gray-600 dark:text-gray-400 mb-8">
          Maaf, halaman yang kamu cari tidak ada atau sudah dihapus.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 rounded-xl bg-[#05A845] text-white font-semibold text-[14px] hover:bg-[#048A38] transition-colors inline-block"
        >
          Kembali
        </button>
      </div>
    </div>
  );
}
