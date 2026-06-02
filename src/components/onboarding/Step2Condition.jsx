import React from 'react';
import { ArrowRight } from 'lucide-react';
import CustomSelect from '../ui/CustomSelect';

const dependentOptions = [
  { value: '0', label: 'Tidak ada (0)' },
  { value: '1', label: '1 Orang' },
  { value: '2', label: '2 Orang' },
  { value: '3', label: '3 Orang' },
  { value: '4', label: '4 Orang atau lebih' },
];

const mealOptions = [
  { value: 'ditanggung_penuh', label: 'Ditanggung Penuh (Ortu)' },
  { value: 'ditanggung_sebagian', label: 'Ditanggung Sebagian' },
  { value: 'tidak_ditanggung', label: 'Bayar sendiri' },
];

const livingOptions = [
  { value: 'ditanggung', label: 'Tinggal dengan orang tua / ditanggung' },
  { value: 'sebagian', label: 'Ditanggung Sebagian' },
  { value: 'bayar_sendiri', label: 'Kos / kontrak bayar sendiri' },
];

export default function Step2Condition({ formData, handleChange, handleNext, setStep, loading, formatRupiah }) {
  return (
    <div className="max-w-[600px] mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center mb-6">
        <h1 className="text-[26px] font-bold text-[#1A1A1A] mb-2">Kondisi Keuangan</h1>
        <p className="text-[#666666] text-[14px]">Ceritakan sedikit kondisi keuanganmu supaya Finly bisa membuat rekomendasi yang lebih realistis.</p>
      </div>

      <form onSubmit={(e) => handleNext(e, 3)} className="space-y-5">
        
        {/* SECTION A */}
        <div className="space-y-3">
          <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">A. Beban Bulanan</h3>
          
          {formData.status_user === 'pekerja' && (
            <div>
              <label className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">Jumlah Tanggungan</label>
              <CustomSelect
                value={formData.jumlah_tanggungan}
                onChange={(value) => handleChange('jumlah_tanggungan', value)}
                options={dependentOptions}
                placeholder="Pilih jumlah tanggungan"
              />
            </div>
          )}

          {formData.status_user === 'pelajar' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">Biaya Makan Bulanan</label>
                <CustomSelect
                  value={formData.status_makan}
                  onChange={(value) => handleChange('status_makan', value)}
                  options={mealOptions}
                  placeholder="Pilih kondisi..."
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">Biaya Tempat Tinggal</label>
                <CustomSelect
                  value={formData.status_tempat_tinggal}
                  onChange={(value) => handleChange('status_tempat_tinggal', value)}
                  options={livingOptions}
                  placeholder="Pilih kondisi..."
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION B */}
        <div className="space-y-3 pt-2">
          <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">B. Keamanan Finansial</h3>
          
          <div>
            <label className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">Stabilitas Pemasukan</label>
            <CustomSelect
              value={formData.stabilitas_pemasukan}
              onChange={(value) => handleChange('stabilitas_pemasukan', value)}
              options={[
                {
                  value: 'stabil',
                  label: formData.status_user === 'pelajar' ? 'Sangat Stabil (Uang saku pasti/beasiswa)' : 'Sangat Stabil (PNS/Pegawai Tetap)',
                },
                {
                  value: 'cukup_stabil',
                  label: formData.status_user === 'pelajar' ? 'Cukup Stabil (Kadang naik-turun/telat)' : 'Cukup Stabil (Kontrak/Bisnis Rutin)',
                },
                {
                  value: 'tidak_menentu',
                  label: formData.status_user === 'pelajar' ? 'Tidak Menentu (Kerja part-time/jualan)' : 'Tidak Menentu (Freelance/Musiman)',
                },
              ]}
              placeholder="Pilih tingkat stabilitas..."
            />
          </div>
          
          <div className="bg-[#F8FCF9] dark:bg-[#05A845]/5 border border-[#DCEFE1] dark:border-[#05A845]/20 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-2.5">
              <label className="block text-[13px] font-semibold text-[#1A1A1A] dark:text-white">Dana Darurat Saat Ini</label>
              <span className="bg-[#EAF6ED] text-[#05A845] px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase shrink-0">Opsional</span>
            </div>

            <input 
              type="text" 
              placeholder="Rp 0"
              value={formData.dana_darurat_saat_ini} 
              onChange={(e) => handleChange('dana_darurat_saat_ini', formatRupiah(e.target.value))} 
              className="w-full font-sans px-4 py-3 border border-gray-200 dark:border-[#2e303a] rounded-xl focus:outline-none focus:border-[#05A845] focus:ring-2 focus:ring-[#EAF6ED] dark:focus:ring-[#05A845]/20 text-[15px] font-semibold text-[#1A1A1A] dark:text-white bg-white dark:bg-[#161616] placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all" 
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 pt-5 mt-5">
          <button type="button" onClick={() => setStep(1)} className="px-8 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-[14px] hover:bg-gray-50 transition-colors sm:w-auto w-full">Kembali</button>
          <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#05A845] text-white font-bold text-[14px] hover:bg-[#048A38] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed w-full">Lanjut <ArrowRight size={18} /></button>
        </div>
      </form>
    </div>
  );
}
