import React from 'react';
import { ArrowRight } from 'lucide-react';
import CustomSelect from '../ui/CustomSelect';

const statusOptions = [
  { value: 'pekerja', label: 'Pekerja / Karyawan' },
  { value: 'pelajar', label: 'Pelajar / Mahasiswa' },
];

const provinceOptions = [
  { value: 'Aceh', label: 'Aceh' },
  { value: 'Sumatera Utara', label: 'Sumatera Utara' },
  { value: 'Sumatera Barat', label: 'Sumatera Barat' },
  { value: 'Riau', label: 'Riau' },
  { value: 'Jambi', label: 'Jambi' },
  { value: 'Sumatera Selatan', label: 'Sumatera Selatan' },
  { value: 'Bengkulu', label: 'Bengkulu' },
  { value: 'Lampung', label: 'Lampung' },
  { value: 'Kepulauan Bangka Belitung', label: 'Kepulauan Bangka Belitung' },
  { value: 'Kepulauan Riau', label: 'Kepulauan Riau' },
  { value: 'DKI Jakarta', label: 'DKI Jakarta' },
  { value: 'Jawa Barat', label: 'Jawa Barat' },
  { value: 'Jawa Tengah', label: 'Jawa Tengah' },
  { value: 'DI Yogyakarta', label: 'DI Yogyakarta' },
  { value: 'Jawa Timur', label: 'Jawa Timur' },
  { value: 'Banten', label: 'Banten' },
  { value: 'Bali', label: 'Bali' },
  { value: 'Nusa Tenggara Barat', label: 'Nusa Tenggara Barat' },
  { value: 'Nusa Tenggara Timur', label: 'Nusa Tenggara Timur' },
  { value: 'Kalimantan Barat', label: 'Kalimantan Barat' },
  { value: 'Kalimantan Tengah', label: 'Kalimantan Tengah' },
  { value: 'Kalimantan Selatan', label: 'Kalimantan Selatan' },
  { value: 'Kalimantan Timur', label: 'Kalimantan Timur' },
  { value: 'Kalimantan Utara', label: 'Kalimantan Utara' },
  { value: 'Sulawesi Utara', label: 'Sulawesi Utara' },
  { value: 'Sulawesi Tengah', label: 'Sulawesi Tengah' },
  { value: 'Sulawesi Selatan', label: 'Sulawesi Selatan' },
  { value: 'Sulawesi Tenggara', label: 'Sulawesi Tenggara' },
  { value: 'Gorontalo', label: 'Gorontalo' },
  { value: 'Sulawesi Barat', label: 'Sulawesi Barat' },
  { value: 'Maluku', label: 'Maluku' },
  { value: 'Maluku Utara', label: 'Maluku Utara' },
  { value: 'Papua Barat', label: 'Papua Barat' },
  { value: 'Papua Barat Daya', label: 'Papua Barat Daya' },
  { value: 'Papua', label: 'Papua' },
  { value: 'Papua Selatan', label: 'Papua Selatan' },
  { value: 'Papua Tengah', label: 'Papua Tengah' },
  { value: 'Papua Pegunungan', label: 'Papua Pegunungan' },
  { value: 'Lainnya', label: 'Lainnya' },
];

export default function Step1_Status({ user, formData, handleChange, handleNext, loading, formatRupiah }) {
  return (
    <div className="max-w-[600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <h1 className="text-[26px] font-bold text-[#1A1A1A] dark:text-white mb-3">
          Halo {user?.full_name ? user.full_name.split(' ')[0] : 'Pengguna'}, mari siapkan profilmu.
        </h1>
        <p className="text-[#666666] dark:text-gray-400 text-[15px]">
          Pilih status supaya perhitungan Finly lebih pas dengan kondisi kamu.
        </p>
      </div>

      <form onSubmit={(e) => handleNext(e, 2)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[14px] font-semibold text-[#1A1A1A] dark:text-white mb-2">Status Saat Ini</label>
            <CustomSelect
              value={formData.status_user}
              onChange={(value) => handleChange('status_user', value)}
              options={statusOptions}
              placeholder="Pilih status"
              buttonClassName="h-[52px] text-[15px]"
            />
          </div>
          <div>
            <label className="block text-[14px] font-semibold text-[#1A1A1A] dark:text-white mb-2">Provinsi Domisili</label>
            <CustomSelect
              value={formData.provinsi}
              onChange={(value) => handleChange('provinsi', value)}
              options={provinceOptions}
              placeholder="Pilih Provinsi (Data BPS)"
              buttonClassName="h-[52px] text-[15px]"
              searchable
              searchPlaceholder="Cari provinsi..."
            />
          </div>
        </div>
        <div>
          <label className="block text-[14px] font-semibold text-[#1A1A1A] dark:text-white mb-2">
            {formData.status_user === 'pelajar' ? 'Total Uang Saku / Pemasukan Bulanan' : 'Total Pendapatan Bersih Bulanan'}
          </label>
          <input
            type="text" placeholder="Rp 0" value={formData.pemasukan_bulanan} onChange={(e) => handleChange('pemasukan_bulanan', formatRupiah(e.target.value))}
            className="w-full font-sans px-4 py-4 border border-gray-200 dark:border-[#2e303a] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EAF6ED] dark:focus:ring-[#05A845]/20 focus:border-[#05A845] text-[20px] font-bold text-[#1A1A1A] dark:text-white bg-white dark:bg-[#161616]" required
          />
        </div>
        <div className="border-t border-gray-100 dark:border-[#2e303a] pt-6 mt-6">
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#05A845] text-white font-bold text-[15px] hover:bg-[#048A38] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
            Lanjut <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
