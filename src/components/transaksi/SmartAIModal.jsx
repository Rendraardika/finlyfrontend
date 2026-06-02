import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, UploadCloud, Loader2, Camera, Check, Image, X, ReceiptText
} from 'lucide-react';
import { getCategories } from '../../services/budgetService';
import CustomSelect from '../ui/CustomSelect';

const fallbackCategoryOptions = [
  { value: 'Kebutuhan Pokok', label: 'Kebutuhan Pokok' },
  { value: 'Makan Siang', label: 'Makan Siang' },
  { value: 'Hiburan & Keinginan', label: 'Hiburan & Keinginan' },
  { value: 'Tagihan & Utilitas', label: 'Tagihan & Utilitas' },
  { value: 'Lainnya', label: 'Lainnya' },
];

export default function SmartAIModal({
  isOpen, onClose, smartStep, onFileSelected, handleSaveSmartAI, scanResult, triggerSimulateAI
}) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState(fallbackCategoryOptions);
  const [notes, setNotes] = useState('');

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  // Fetch categories from database dynamically
  useEffect(() => {
    if (isOpen) {
      getCategories('expense')
        .then((response) => {
          const backendCategories = response?.data?.categories || [];
          if (backendCategories.length > 0) {
            const options = backendCategories.map((cat) => ({
              value: cat.name,
              label: cat.name,
            }));
            setCategories(options);
            setSelectedCategory(options[0]?.value || 'Lainnya');
          } else {
            setCategories(fallbackCategoryOptions);
            setSelectedCategory('Kebutuhan Pokok');
          }
        })
        .catch((err) => {
          console.error('Error loading categories in SmartAIModal:', err);
          setCategories(fallbackCategoryOptions);
          setSelectedCategory('Kebutuhan Pokok');
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (scanResult) {
      setAmount(scanResult.total ?? '');
      setTitle(scanResult.merchant ? `Pembelian di ${scanResult.merchant}` : 'Pembelian Struk');
      setMerchant(scanResult.merchant ?? '');
      
      let formattedDate = '';
      if (scanResult.transaction_date) {
        try {
          const d = new Date(scanResult.transaction_date);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split('T')[0];
          }
        } catch (e) {
          formattedDate = scanResult.transaction_date;
        }
      }
      setDate(formattedDate || new Date().toISOString().split('T')[0]);
      
      const categoryName = scanResult.category_name || 'Kebutuhan Pokok';
      setSelectedCategory(categoryName);
      setNotes('');
    }
  }, [scanResult]);

  // Turn off camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileSelected) {
      onFileSelected(file);
    }
  };

  const triggerGallerySelect = () => {
    fileInputRef.current?.click();
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Gagal membuka kamera:', err);
      alert('Gagal mengakses kamera laptop/perangkat Anda. Harap berikan izin kamera pada browser.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const takeSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      // Flip snapshot if using standard webcam (mirror effect)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'captured-receipt.jpg', { type: 'image/jpeg' });
          stopCamera();
          if (onFileSelected) {
            onFileSelected(file);
          }
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 md:items-center md:p-4">
      {/* Hidden file input for gallery upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*"
      />

      <div className="bg-white dark:bg-[#1f2028] w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-lg md:rounded-[24px] shadow-2xl overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-300">
        <div className="shrink-0 flex justify-between items-center gap-4 p-4 md:p-6 border-b border-gray-100 dark:border-[#2e303a] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#05A845] to-transparent"></div>
          <h3 className="min-w-0 text-[16px] md:text-[18px] font-bold text-[#1A1A1A] dark:text-white flex items-center gap-2 break-words">
            <Sparkles size={20} className="text-[#05A845] shrink-0" /> Smart Input AI
          </h3>

          {smartStep !== 2 && (
            <button onClick={handleClose} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 shrink-0">
              <X size={20} />
            </button>
          )}
        </div>

        {smartStep === 1 && !isCameraActive && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 text-center animate-in fade-in duration-300">
            <div className="min-h-full border-2 border-dashed border-gray-300 dark:border-[#3a3d46] rounded-2xl p-4 md:p-8 flex flex-col items-center justify-center hover:bg-[#EAF6ED]/10 dark:hover:bg-[#05A845]/10 transition-all">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 dark:bg-white/[0.04] rounded-full flex items-center justify-center mb-3 md:mb-4">
                <UploadCloud size={28} className="md:w-8 md:h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <h4 className="text-[14px] md:text-[16px] font-bold text-[#1A1A1A] dark:text-white mb-2">Pindai Struk Belanja</h4>
              <p className="text-[12px] md:text-[13px] text-gray-500 dark:text-gray-400 max-w-[250px] mx-auto leading-relaxed mb-6 md:mb-8">
                Upload struknya, nanti Finly bantu baca nominal dan detail transaksinya.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full justify-center">
                <button
                  onClick={startCamera}
                  className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl bg-[#05A845] text-white font-semibold text-[13px] md:text-[14px] hover:bg-[#048A38] shadow-sm transition-colors w-full sm:w-auto"
                >
                  <Camera size={16} /> Ambil Foto
                </button>
                <button
                  onClick={triggerGallerySelect}
                  className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl border border-gray-200 dark:border-[#2e303a] text-[#1A1A1A] dark:text-white font-semibold text-[13px] md:text-[14px] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors w-full sm:w-auto"
                >
                  <Image size={16} className="text-gray-500 dark:text-gray-400" /> Pilih File
                </button>
              </div>

              {/* Link Simulasi Mock / Demo */}
              <button
                type="button"
                onClick={triggerSimulateAI}
                className="mt-6 text-[12px] text-gray-400 hover:text-[#05A845] underline transition-colors"
              >
                Coba mode demo (simulasi struk)
              </button>
            </div>
          </div>
        )}

        {smartStep === 1 && isCameraActive && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 dark:border-[#2e303a] bg-black relative aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Live Camera
              </div>
            </div>

            <div className="mt-4 flex gap-3 w-full justify-center">
              <button
                type="button"
                onClick={takeSnapshot}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#05A845] text-white font-semibold text-[13px] md:text-[14px] hover:bg-[#048A38] shadow-sm transition-colors"
              >
                <Camera size={16} /> Jepret Struk
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2e303a] text-gray-500 dark:text-gray-400 font-semibold text-[13px] md:text-[14px] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {smartStep === 2 && (
          <div className="flex-1 overflow-y-auto p-8 md:p-16 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
            <div className="relative mb-4 md:mb-6">
              <div className="absolute inset-0 border-4 border-[#EAF6ED] dark:border-[#05A845]/20 rounded-full"></div>
              <Loader2 size={48} className="md:w-14 md:h-14 text-[#05A845] animate-spin relative z-10" />
            </div>
            <h4 className="text-[16px] md:text-[18px] font-bold text-[#1A1A1A] dark:text-white mb-2">Menganalisis Struk...</h4>
            <p className="text-[13px] md:text-[14px] text-gray-500 dark:text-gray-400">Finly sedang membaca nominal, tanggal, dan merchant.</p>
          </div>
        )}

        {smartStep === 3 && (
          <>
            <div className="shrink-0 p-4 md:p-6 bg-[#EAF6ED]/50 dark:bg-[#05A845]/10 border-b border-[#05A845]/20 dark:border-[#05A845]/10 flex items-start gap-3 md:gap-4 animate-in fade-in slide-in-from-right-8 duration-300">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-[#2a2d36] rounded-xl shadow-sm border border-[#05A845]/20 dark:border-[#05A845]/30 flex items-center justify-center shrink-0">
                <ReceiptText size={20} className="text-[#05A845]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] md:text-[14px] font-bold text-[#05A845] break-words">Berhasil Diekstrak!</h4>
                <p className="text-[11px] md:text-[12px] text-gray-600 dark:text-gray-400 break-words">Cek lagi hasil bacaannya sebelum disimpan.</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
              <div>
                <label className="block text-[11px] md:text-[12px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Nominal (Terdeteksi)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-[14px]">Rp</span>
                  <input
                    type="text"
                    value={amount ? new Intl.NumberFormat('id-ID').format(amount) : ''}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full min-w-0 pl-11 pr-4 py-3 border-2 border-[#05A845]/30 dark:border-[#05A845]/20 rounded-xl focus:outline-none focus:border-[#05A845] font-bold text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] text-[14px] md:text-[15px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
                <div className="min-w-0 sm:col-span-2">
                  <label className="block text-[11px] md:text-[12px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Deskripsi</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full min-w-0 px-4 py-2 border border-gray-200 dark:border-[#2e303a] rounded-xl text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] text-[13px] md:text-[14px]"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-[11px] md:text-[12px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Merchant</label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full min-w-0 px-4 py-2 border border-gray-200 dark:border-[#2e303a] rounded-xl text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] text-[13px] md:text-[14px]"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-[11px] md:text-[12px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full min-w-0 px-4 py-2 border border-gray-200 dark:border-[#2e303a] rounded-xl text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] text-[13px] md:text-[14px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] md:text-[12px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Pilih Kategori Transaksi</label>
                <CustomSelect
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={categories}
                  placeholder="-- Pilih kategori secara manual --"
                  buttonClassName="h-10 bg-white dark:bg-[#2a2d36] text-[13px] md:text-[14px]"
                  searchable
                  searchPlaceholder="Cari kategori..."
                />
              </div>
            </div>

            <div className="shrink-0 p-4 md:p-6 border-t border-gray-100 dark:border-[#2e303a] flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3 bg-gray-50 dark:bg-white/[0.02]">
              <button
                onClick={handleClose}
                className="w-full md:w-auto px-5 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 font-semibold text-[13px] md:text-[14px] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleSaveSmartAI({
                  amount: Number(amount || 0),
                  title,
                  merchant,
                  transaction_date: date,
                  category_name: selectedCategory,
                  notes: notes || title
                })}
                className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#05A845] text-white font-semibold text-[13px] md:text-[14px] hover:bg-[#048A38] shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Check size={16} /> Konfirmasi & Simpan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
