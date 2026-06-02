export const initialOnboardingForm = {
  nama_panggilan: '',
  status_user: '',
  provinsi: '',
  pemasukan_bulanan: '',
  jumlah_tanggungan: '',
  dana_darurat_saat_ini: '',
  stabilitas_pemasukan: '',
  status_makan: '',
  status_tempat_tinggal: '',
  tujuan_keuangan: '',
  horizon_tujuan: '',
};

export const formatRupiah = (angka) => {
  const numberString = String(angka || '').replace(/[^,\d]/g, '').toString();
  const split = numberString.split(',');
  const sisa = split[0].length % 3;
  let rupiah = split[0].substr(0, sisa);
  const ribuan = split[0].substr(sisa).match(/\d{3}/gi);
  if (ribuan) {
    const separator = sisa ? '.' : '';
    rupiah += separator + ribuan.join('.');
  }
  return rupiah ? `Rp ${rupiah}` : '';
};

export const getNumber = (rupiahStr) => {
  if (!rupiahStr) return 0;
  return parseInt(String(rupiahStr).replace(/[^0-9]/g, ''), 10);
};
