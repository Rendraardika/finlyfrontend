import React, { useEffect, useRef, useState } from 'react';
import {
  Search, Filter, Plus, Sparkles, ChevronDown, ChevronUp,
  Pencil, Trash2, FileText, ChevronLeft, ChevronRight,
  FileSpreadsheet, Loader, MessageCircle, ExternalLink, Copy, X
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import TransactionStats from '../components/transaksi/TransactionStats';
import TransactionModal from '../components/transaksi/TransactionModal';
import SmartAIModal from '../components/transaksi/SmartAIModal';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import useTransactions from '../hooks/useTransactions';
import useClickOutside from '../hooks/useClickOutside';
import { formatIDR } from '../utils/transactionViewModel';
import { compareIndonesianDates, getMonthYearFromIndonesianDate } from '../utils/dateHelper';
import { createWhatsAppLinkCode } from '../services/whatsappLinkService';

const WHATSAPP_BOT_PHONE_DISPLAY = '+62 877-6371-4489';
const WHATSAPP_BOT_PHONE_LINK = '6287763714489';

const sanitizeFileName = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'semua';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const downloadBlob = (content, fileName, mimeType) => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const getTransactionExportRows = (items) => items.map((trx, index) => ({
  no: index + 1,
  tanggal: trx.date || '-',
  deskripsi: trx.title || '-',
  merchant: trx.merchant || '-',
  kategori: trx.category || '-',
  tipe: trx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
  nominal: Number(Math.abs(trx.amount || 0)),
  catatan: trx.note || '-',
}));

const getExportSummary = (items) => {
  const income = items
    .filter((trx) => trx.type === 'income')
    .reduce((total, trx) => total + Math.abs(Number(trx.amount || 0)), 0);
  const expense = items
    .filter((trx) => trx.type === 'expense')
    .reduce((total, trx) => total + Math.abs(Number(trx.amount || 0)), 0);
  return { income, expense, balance: income - expense };
};

const buildExcelWorkbook = ({ rows, summary, generatedAt, filterLabel }) => {
  const summaryRows = [
    ['Total Pemasukan', summary.income],
    ['Total Pengeluaran', summary.expense],
    ['Selisih Bersih', summary.balance],
    ['Jumlah Transaksi', rows.length],
    ['Filter', filterLabel],
    ['Tanggal Export', generatedAt],
  ];

  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th { background: #05A845; color: #fff; font-weight: 700; }
    th, td { border: 1px solid #d9e2ec; padding: 8px; font-size: 12px; }
    .title { font-size: 20px; font-weight: 700; color: #111827; }
    .money { mso-number-format:"\\#\\,\\#\\#0"; text-align: right; }
  </style>
</head>
<body>
  <p class="title">Riwayat Transaksi Finly</p>
  <table>
    <tbody>
      ${summaryRows.map(([label, value]) => `
        <tr>
          <td><strong>${escapeHtml(label)}</strong></td>
          <td>${typeof value === 'number' ? value : escapeHtml(value)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <br />
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Tanggal</th>
        <th>Deskripsi</th>
        <th>Merchant</th>
        <th>Kategori</th>
        <th>Tipe</th>
        <th>Nominal</th>
        <th>Catatan</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((row) => `
        <tr>
          <td>${row.no}</td>
          <td>${escapeHtml(row.tanggal)}</td>
          <td>${escapeHtml(row.deskripsi)}</td>
          <td>${escapeHtml(row.merchant)}</td>
          <td>${escapeHtml(row.kategori)}</td>
          <td>${escapeHtml(row.tipe)}</td>
          <td class="money">${row.nominal}</td>
          <td>${escapeHtml(row.catatan)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
};

const escapePdfText = (value) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[^\x20-\x7E]/g, '')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)');

const wrapPdfText = (text, maxLength) => {
  const words = String(text || '-').split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : ['-'];
};

const buildPdfDocument = ({ rows, summary, generatedAt, filterLabel }) => {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const bottom = 42;
  const pages = [];
  let commands = [];
  let y = pageHeight - margin;

  const startPage = () => {
    if (commands.length) pages.push(commands.join('\n'));
    commands = [];
    y = pageHeight - margin;
  };

  const drawText = (text, x, size = 10, font = 'F1') => {
    commands.push(`BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`);
  };

  const nextLine = (height = 15) => {
    y -= height;
    if (y < bottom) startPage();
  };

  const drawRule = () => {
    commands.push(`${margin} ${y.toFixed(2)} m ${pageWidth - margin} ${y.toFixed(2)} l S`);
    nextLine(12);
  };

  drawText('Riwayat Transaksi Finly', margin, 18, 'F2');
  nextLine(22);
  drawText(`Dibuat: ${generatedAt}`, margin, 10);
  nextLine(14);
  drawText(`Filter: ${filterLabel}`, margin, 10);
  nextLine(18);
  drawText(`Total Pemasukan: ${formatIDR(summary.income)}`, margin, 11, 'F2');
  drawText(`Total Pengeluaran: ${formatIDR(summary.expense)}`, 230, 11, 'F2');
  drawText(`Selisih: ${formatIDR(summary.balance)}`, 420, 11, 'F2');
  nextLine(20);
  drawRule();

  drawText('No', margin, 9, 'F2');
  drawText('Tanggal', 66, 9, 'F2');
  drawText('Deskripsi', 136, 9, 'F2');
  drawText('Kategori', 325, 9, 'F2');
  drawText('Tipe', 420, 9, 'F2');
  drawText('Nominal', 480, 9, 'F2');
  nextLine(14);
  drawRule();

  rows.forEach((row) => {
    const titleLines = wrapPdfText(row.deskripsi, 30).slice(0, 2);
    const noteLines = row.catatan && row.catatan !== '-' ? wrapPdfText(`Catatan: ${row.catatan}`, 72).slice(0, 2) : [];
    const rowHeight = 14 + (titleLines.length - 1) * 11 + noteLines.length * 11;
    if (y - rowHeight < bottom) startPage();

    const rowTop = y;
    drawText(String(row.no), margin, 9);
    drawText(row.tanggal, 66, 9);
    drawText(titleLines[0], 136, 9, 'F2');
    drawText(row.kategori, 325, 9);
    drawText(row.tipe, 420, 9);
    drawText(formatIDR(row.nominal), 480, 9);

    titleLines.slice(1).forEach((line, index) => {
      y = rowTop - 11 * (index + 1);
      drawText(line, 136, 9);
    });
    noteLines.forEach((line, index) => {
      y = rowTop - 11 * (titleLines.length + index);
      drawText(line, 136, 8);
    });
    y = rowTop - rowHeight;
  });

  if (!rows.length) {
    drawText('Tidak ada transaksi sesuai filter.', margin, 10);
  }

  pages.push(commands.join('\n'));

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
  ];

  pages.forEach((content, index) => {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentObjectNumber} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
};

export default function Transaksi() {
  const { showSuccess, showError, showInfo } = useToast();
  const { confirm } = useConfirm();
  const {
    transactions,
    transactionSummary,
    isLoading,
    loadError,
    deleteById,
    saveTransaction,
    saveSmartTransaction,
    scanReceiptImage,
  } = useTransactions({ showError, showSuccess, showInfo });
  
  const [activeTab, setActiveTab] = useState('semua');
  const [expandedRow, setExpandedRow] = useState(null);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('Semua Waktu');
  const [sortFilter, setSortFilter] = useState('terbaru');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualType, setManualType] = useState('expense');
  const [editingData, setEditingData] = useState(null);
  const [nominalInput, setNominalInput] = useState('');

  const [isSmartOpen, setIsSmartOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [whatsappCode, setWhatsappCode] = useState(null);
  const [whatsappCodeLoading, setWhatsappCodeLoading] = useState(false);
  const [smartStep, setSmartStep] = useState(1);
  const [scanResult, setScanResult] = useState(null);
  const filterControlsRef = useRef(null);

  const handleNominalChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (rawValue === '') {
      setNominalInput('');
      return;
    }
    const formattedValue = new Intl.NumberFormat('id-ID').format(rawValue);
    setNominalInput(formattedValue);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Hapus Transaksi?',
      message: 'Transaksi ini akan dihapus permanen dan tidak bisa dikembalikan.',
      confirmText: 'Hapus',
      isDanger: true
    });

    if (confirmed) {
      const deleted = await deleteById(id);
      if (deleted) {
        setExpandedRow(null);
      }
    }
  };

  const handleSaveTransaction = async (transaction) => {
    const saved = await saveTransaction(transaction, editingData);
    if (saved) {
      setSelectedMonth('Semua Waktu');
      setExpandedRow(null);
      setEditingData(null);
    }
  };

  const closeSmartModal = () => {
    setIsSmartOpen(false);
    setSmartStep(1);
    setScanResult(null);
  };

  const handleSimulateAI = () => {
    setSmartStep(2);
    setTimeout(() => {
      setScanResult({
        merchant: 'Kopi Kenangan (Simulasi)',
        total: 185000,
        transaction_date: '2026-05-27',
        category_name: 'makanan'
      });
      setSmartStep(3);
    }, 2000);
  };

  const handleFileSelected = async (file) => {
    setSmartStep(2);
    try {
      const response = await scanReceiptImage(file);
      if (response.success && response.data) {
        setScanResult(response.data);
        setSmartStep(3);
      } else {
        throw new Error(response.message || 'Gagal membaca struk');
      }
    } catch (err) {
      console.error('Error scanning file:', err);
      showInfo('Deteksi AI offline/gagal, menjalankan mode demo...');
      handleSimulateAI();
    }
  };

  const handleSaveSmartAI = async (editedData) => {
    const saved = await saveSmartTransaction(editedData);
    if (saved) {
      setSelectedMonth('Semua Waktu');
      closeSmartModal();
    }
  };

  const handleCreateWhatsAppCode = async () => {
    try {
      setWhatsappCodeLoading(true);
      const code = await createWhatsAppLinkCode();
      setWhatsappCode(code);
      showSuccess('Kode link WhatsApp berhasil dibuat');
    } catch (error) {
      showError(error.response?.data?.message || 'Gagal membuat kode link WhatsApp');
    } finally {
      setWhatsappCodeLoading(false);
    }
  };

  const handleCopyWhatsAppCode = async () => {
    if (!whatsappCode?.code) return;

    try {
      await navigator.clipboard.writeText(`link ${whatsappCode.code}`);
      showSuccess('Kode link disalin');
    } catch (_error) {
      showInfo(`Kirim ke bot: link ${whatsappCode.code}`);
    }
  };

  const pageSize = 10;
  const transactionTypeOptions = [
    { value: 'semua', label: 'Semua Transaksi' },
    { value: 'pemasukan', label: 'Pemasukan' },
    { value: 'pengeluaran', label: 'Pengeluaran' },
  ];
  const activeTypeLabel = transactionTypeOptions.find((option) => option.value === activeTab)?.label || 'Semua Transaksi';
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredData = transactions
    .filter((trx) => {
      if (activeTab === 'pemasukan') return trx.type === 'income';
      if (activeTab === 'pengeluaran') return trx.type === 'expense';
      return true;
    })
    .filter((trx) => {
      if (selectedMonth === 'Semua Waktu') return true;
      const monthYear = getMonthYearFromIndonesianDate(trx.date);
      const selectedMonthYear = selectedMonth.split(' ');
      return monthYear.month === selectedMonthYear[0] && monthYear.year === selectedMonthYear[1];
    })
    .filter((trx) => {
      if (!normalizedSearchQuery) return true;

      const searchableText = [
        trx.title,
        trx.merchant,
        trx.category,
        trx.note,
        trx.date,
        trx.type === 'income' ? 'pemasukan masuk income' : 'pengeluaran keluar expense',
        String(Math.abs(trx.amount || 0)),
      ].join(' ').toLowerCase();

      return searchableText.includes(normalizedSearchQuery);
    })
    .sort((a, b) => {
      if (sortFilter === 'terbesar') return Math.abs(b.amount) - Math.abs(a.amount);
      if (sortFilter === 'terkecil') return Math.abs(a.amount) - Math.abs(b.amount);
      
      const dateComparison = compareIndonesianDates(a.date, b.date);
      if (sortFilter === 'terlama') return dateComparison;
      return -dateComparison;
    });

  const exportFilterLabel = [
    activeTypeLabel,
    selectedMonth,
    `Urutan: ${sortFilter}`,
    normalizedSearchQuery ? `Pencarian: ${searchQuery.trim()}` : null,
  ].filter(Boolean).join(' | ');
  const exportFileBaseName = `riwayat-transaksi-${sanitizeFileName(activeTypeLabel)}-${sanitizeFileName(selectedMonth)}`;

  const handleExportExcel = () => {
    const rows = getTransactionExportRows(filteredData);
    const summary = getExportSummary(filteredData);
    const generatedAt = new Date().toLocaleString('id-ID');
    const workbook = buildExcelWorkbook({
      rows,
      summary,
      generatedAt,
      filterLabel: exportFilterLabel,
    });

    downloadBlob(
      workbook,
      `${exportFileBaseName}.xls`,
      'application/vnd.ms-excel;charset=utf-8'
    );
    showSuccess(`Excel riwayat transaksi berhasil diunduh (${rows.length} transaksi).`);
  };

  const handleExportPdf = () => {
    const rows = getTransactionExportRows(filteredData);
    const summary = getExportSummary(filteredData);
    const generatedAt = new Date().toLocaleString('id-ID');
    const pdf = buildPdfDocument({
      rows,
      summary,
      generatedAt,
      filterLabel: exportFilterLabel,
    });

    downloadBlob(pdf, `${exportFileBaseName}.pdf`, 'application/pdf');
    showSuccess(`PDF riwayat transaksi berhasil diunduh (${rows.length} transaksi).`);
  };

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(pageStartIndex, pageStartIndex + pageSize);
  const visibleStart = filteredData.length === 0 ? 0 : pageStartIndex + 1;
  const visibleEnd = Math.min(pageStartIndex + paginatedData.length, filteredData.length);
  const pageButtons = Array.from({ length: totalPages }, (_, index) => index + 1);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedRow(null);
  }, [activeTab, selectedMonth, sortFilter, searchQuery]);

  useClickOutside(filterControlsRef, () => {
    setIsTypeDropdownOpen(false);
    setIsMonthDropdownOpen(false);
    setIsFilterDropdownOpen(false);
  }, isTypeDropdownOpen || isMonthDropdownOpen || isFilterDropdownOpen);

  const toggleRow = (id) => {
    if (expandedRow === id) setExpandedRow(null);
    else setExpandedRow(id);
  };

  const handleEditTransaction = (trx) => {
    setEditingData(trx);
    setManualType(trx.type);
    setIsManualOpen(true);
    setNominalInput(new Intl.NumberFormat('id-ID').format(Math.abs(trx.amount)));
  };

  const toggleDateSort = () => {
    setSortFilter((current) => (current === 'terbaru' ? 'terlama' : 'terbaru'));
  };

  const toggleAmountSort = () => {
    setSortFilter((current) => (current === 'terbesar' ? 'terkecil' : 'terbesar'));
  };

  return (
    <AppLayout activeMenu="transaksi">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto w-full relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="min-w-0">
            <h1 className="text-[22px] sm:text-[26px] font-bold page-title mb-1 break-words">Daftar Transaksi</h1>
            <p className="page-subtitle text-[14px] sm:text-[15px] break-words">Pantau dan kelola arus kasmu.</p>
          </div>

          {!isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                setIsSmartOpen(true);
                setSmartStep(1);
              }}
              className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl border border-[#05A845] text-[#05A845] font-semibold text-[14px] hover:bg-[#EAF6ED] dark:hover:bg-[#05A845]/10 transition-colors shadow-sm"
            >
              <Sparkles size={18} className="shrink-0" />
              <span className="truncate">Smart Input AI</span>
            </button>

            <button
              onClick={() => setIsWhatsAppOpen(true)}
              className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl border border-[#05A845] text-[#05A845] font-semibold text-[14px] hover:bg-[#EAF6ED] dark:hover:bg-[#05A845]/10 transition-colors shadow-sm"
            >
              <MessageCircle size={18} className="shrink-0" />
              <span className="truncate">Hubungkan WhatsApp</span>
            </button>

            <button
              onClick={() => {
                setEditingData(null);
                setManualType('expense');
                setIsManualOpen(true);
                setNominalInput('');
              }}
              className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-[#05A845] text-white font-semibold text-[14px] hover:bg-[#048A38] transition-colors shadow-sm"
            >
              <Plus size={18} className="shrink-0" />
              <span className="truncate">Tambah Transaksi</span>
            </button>
          </div>
          )}
        </div>

        {isLoading && (
          <div className="app-card rounded-[24px] py-16 flex flex-col items-center justify-center">
            <Loader size={48} className="text-gray-400 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-[14px]">Memuat transaksi...</p>
          </div>
        )}

        {loadError && !isLoading && (
          <div className="app-card rounded-[24px] p-6 mb-6">
            <EmptyState
              icon="error"
              title="Gagal Memuat Transaksi"
              message={loadError || 'Terjadi kesalahan saat memuat data. Silakan coba lagi.'}
              buttonText="Muat Ulang"
              onButtonClick={() => window.location.reload()}
            />
          </div>
        )}

        {!isLoading && !loadError && (
          <>
            <TransactionStats summary={transactionSummary} />

        <div className="app-card rounded-[24px] overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-6 sm:p-8">
              <EmptyState
                icon="empty"
                title="Belum ada transaksi"
                message="Mulai dengan menambahkan transaksi pertamamu."
                buttonText="Tambah Transaksi"
                onButtonClick={() => {
                  setEditingData(null);
                  setManualType('expense');
                  setIsManualOpen(true);
                  setNominalInput('');
                }}
              />
            </div>
          ) : (
            <>
              <div className="p-4 sm:p-6 border-b app-divider space-y-4">
            <div ref={filterControlsRef} className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(170px,1fr)_minmax(170px,1fr)_auto] lg:flex gap-3 w-full lg:w-auto items-stretch lg:items-center">
              <div className="relative min-w-0">
                <button
                  type="button"
                  onClick={() => { setIsTypeDropdownOpen(!isTypeDropdownOpen); setIsMonthDropdownOpen(false); setIsFilterDropdownOpen(false); }}
                  aria-expanded={isTypeDropdownOpen}
                  className={`flex w-full items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#1f2028] border rounded-xl text-[13px] text-[#1A1A1A] dark:text-white font-medium shadow-sm lg:w-auto lg:min-w-[170px] whitespace-nowrap transition-colors ${isTypeDropdownOpen ? 'border-[#05A845]' : 'border-gray-200 dark:border-[#2e303a]'}`}
                >
                  <span className="truncate">{activeTypeLabel}</span>
                  <ChevronDown size={14} className={`text-gray-400 dark:text-gray-500 shrink-0 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isTypeDropdownOpen && (
                  <div className="absolute left-0 top-full z-40 mt-2 w-full min-w-[190px] overflow-hidden rounded-xl border border-gray-100 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] shadow-lg animate-in fade-in zoom-in-95">
                    <div className="py-1">
                      {transactionTypeOptions.map((option) => {
                        const isSelected = activeTab === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => { setActiveTab(option.value); setIsTypeDropdownOpen(false); }}
                            className={`w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${isSelected ? 'bg-[#EAF6ED] dark:bg-[#05A845]/15 text-[#05A845]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06]'}`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative min-w-0">
                <button
                  type="button"
                  onClick={() => { setIsMonthDropdownOpen(!isMonthDropdownOpen); setIsTypeDropdownOpen(false); setIsFilterDropdownOpen(false); }}
                  aria-expanded={isMonthDropdownOpen}
                  className={`flex w-full items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#1f2028] border rounded-xl text-[13px] text-[#1A1A1A] dark:text-white font-medium shadow-sm lg:w-auto lg:min-w-[170px] whitespace-nowrap transition-colors ${isMonthDropdownOpen ? 'border-[#05A845]' : 'border-gray-200 dark:border-[#2e303a]'}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{selectedMonth}</span>
                  </span>
                  <ChevronDown size={14} className={`text-gray-400 dark:text-gray-500 shrink-0 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMonthDropdownOpen && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-full min-w-[190px] overflow-hidden rounded-xl border border-gray-100 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] shadow-lg animate-in fade-in zoom-in-95">
                    <div className="max-h-64 overflow-y-auto py-1">
                      {['Agustus 2026', 'September 2026', 'Oktober 2026', 'Semua Waktu'].map((m) => {
                        const isSelected = selectedMonth === m;

                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => { setSelectedMonth(m); setIsMonthDropdownOpen(false); }}
                            className={`w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${isSelected ? 'bg-[#EAF6ED] dark:bg-[#05A845]/15 text-[#05A845]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06]'}`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => { setIsFilterDropdownOpen(!isFilterDropdownOpen); setIsTypeDropdownOpen(false); setIsMonthDropdownOpen(false); }}
                  className={`w-full sm:w-auto h-full min-h-[40px] px-4 sm:px-2.5 flex items-center justify-center border rounded-xl transition-colors ${isFilterDropdownOpen ? 'border-[#05A845] bg-[#EAF6ED] dark:bg-[#05A845]/10 text-[#05A845]' : 'border-gray-200 dark:border-[#2e303a] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]'}`}
                >
                  <Filter size={18} />
                </button>
                {isFilterDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 app-dropdown rounded-xl overflow-hidden z-20 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-gray-50 dark:border-[#2e303a] text-[11px] font-bold text-gray-400 uppercase">Urutkan Berdasarkan</div>
                    {['terbaru', 'terlama', 'terbesar', 'terkecil'].map((opt) => (
                      <div
                        key={opt}
                        onClick={() => { setSortFilter(opt); setIsFilterDropdownOpen(false); }}
                        className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04] capitalize ${sortFilter === opt ? 'text-[#05A845] bg-[#EAF6ED]/50 dark:bg-[#05A845]/10' : 'text-gray-600 dark:text-gray-300'}`}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tombol Export */}
              <div className="grid grid-cols-2 gap-2 sm:col-span-3 lg:flex">
                <button
                  onClick={handleExportPdf}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-[#2e303a] rounded-xl text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-[13px] font-medium whitespace-nowrap"
                >
                  <FileText size={16} className="text-red-500 shrink-0" />
                  <span className="hidden lg:inline">Download PDF</span>
                  <span className="lg:hidden">PDF</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-[#2e303a] rounded-xl text-gray-600 dark:text-gray-400 hover:text-[#05A845] hover:bg-[#EAF6ED] dark:hover:bg-[#05A845]/10 transition-colors text-[13px] font-medium whitespace-nowrap"
                >
                  <FileSpreadsheet size={16} className="text-[#05A845] shrink-0" />
                  <span className="hidden lg:inline">Download Excel</span>
                  <span className="lg:hidden">Excel</span>
                </button>
              </div>
            </div>
            </div>

            <div className="relative w-full">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari transaksi berdasarkan nama, kategori, merchant, tanggal, atau nominal..."
                className="w-full h-11 rounded-xl border border-gray-200 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] pl-11 pr-4 text-[13px] font-medium text-[#1A1A1A] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-colors focus:border-[#05A845] focus:ring-2 focus:ring-[#05A845]/10"
              />
            </div>
          </div>

          {/* Mobile card konten */}
          <div className="md:hidden p-4 space-y-3">
            {filteredData.length === 0 ? (
              <EmptyState
                icon="empty"
                title="Belum ada transaksi"
                message="Mulai dengan menambahkan transaksi pertamamu."
                buttonText="Tambah Transaksi"
                onButtonClick={() => {
                  setEditingData(null);
                  setManualType('expense');
                  setIsManualOpen(true);
                  setNominalInput('');
                }}
              />
            ) : (
              paginatedData.map((trx) => (
                <div
                  key={trx.id}
                  onClick={() => toggleRow(trx.id)}
                  className={`rounded-2xl border app-divider p-4 transition-colors cursor-pointer ${expandedRow === trx.id ? 'bg-gray-50 dark:bg-white/[0.03]' : 'bg-white dark:bg-[#1f2028]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] app-muted mb-1 break-words">{trx.date}</p>
                      <h4 className="text-[15px] font-bold app-heading break-words">{trx.title}</h4>
                      <p className="text-[13px] app-muted break-words">{trx.merchant}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-[14px] font-bold whitespace-nowrap ${trx.type === 'income' ? 'text-[#05A845]' : 'text-red-500'}`}>
                        {trx.type === 'income' ? '' : '-'} {formatIDR(Math.abs(trx.amount))}
                      </p>
                      <button className="mt-1 text-gray-400 dark:text-gray-500 p-1">
                        {expandedRow === trx.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 app-chip rounded-lg text-[12px] font-semibold break-words">
                      {trx.category}
                    </span>
                  </div>

                  {expandedRow === trx.id && (
                    <div className="mt-4 pt-4 border-t app-divider animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Catatan Transaksi</p>
                      <p className="text-[#1A1A1A] dark:text-white text-[14px] leading-relaxed mb-4 break-words">{trx.note || '-'}</p>

                      {trx.hasReceipt && (
                        <button
                          onClick={(e) => { e.stopPropagation(); showInfo('Menampilkan bukti/struk transaksi...'); }}
                          className="flex items-center justify-center gap-2 px-3 py-2 app-card-soft rounded-lg text-[#05A845] text-[13px] font-medium hover:bg-[#EAF6ED] dark:hover:bg-[#05A845]/10 hover:border-[#05A845]/30 transition-colors w-full mb-3"
                        >
                          <FileText size={16} /> Lihat Bukti/Struk
                        </button>
                      )}

                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditTransaction(trx); }}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#EAF6ED] dark:bg-[#05A845]/10 text-[#05A845] rounded-xl text-[13px] font-semibold hover:bg-[#d1ebd6] dark:hover:bg-[#05A845]/20 transition-colors w-full"
                        >
                          <Pencil size={16} /> Edit Transaksi
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(trx.id); }}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-[13px] font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors w-full"
                        >
                          <Trash2 size={16} /> Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop table content */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-[640px] w-full text-left border-collapse">
              <thead>
                <tr className="border-b app-divider text-[12px] font-bold text-gray-400 uppercase tracking-wider bg-white dark:bg-[#1f2028]">
                  <th className="px-6 py-4 font-semibold">
                    <button
                      type="button"
                      onClick={toggleDateSort}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -mx-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-[#05A845] ${['terbaru', 'terlama'].includes(sortFilter) ? 'text-[#05A845]' : ''}`}
                    >
                      Tanggal
                      <ChevronDown size={14} className={`transition-transform ${sortFilter === 'terlama' ? 'rotate-180' : ''}`} />
                    </button>
                  </th>
                  <th className="px-6 py-4 font-semibold">Deskripsi</th>
                  <th className="px-6 py-4 font-semibold">Merchant</th>
                  <th className="px-6 py-4 font-semibold">Kategori</th>
                  <th className="px-6 py-4 font-semibold text-right">
                    <button
                      type="button"
                      onClick={toggleAmountSort}
                      className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -mx-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-[#05A845] ${['terbesar', 'terkecil'].includes(sortFilter) ? 'text-[#05A845]' : ''}`}
                    >
                      Nominal
                      <ChevronDown size={14} className={`transition-transform ${sortFilter === 'terkecil' ? 'rotate-180' : ''}`} />
                    </button>
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y app-divider">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-500 dark:text-gray-400 text-[14px]">Tidak ada transaksi ditemukan.</td>
                  </tr>
                ) : (
                  paginatedData.map((trx) => (
                    <React.Fragment key={trx.id}>
                      <tr
                        onClick={() => toggleRow(trx.id)}
                        className={`app-hover transition-colors cursor-pointer group ${
                          expandedRow === trx.id ? 'bg-gray-50 dark:bg-white/[0.04]' : 'bg-white dark:bg-[#1f2028]'
                        }`}
                      >
                        <td className="px-6 py-4 text-[14px] app-muted whitespace-nowrap">{trx.date}</td>
                        <td className="px-6 py-4 min-w-0">
                          <p className="text-[15px] font-bold app-heading truncate max-w-[180px]">{trx.title}</p>
                        </td>
                        <td className="px-6 py-4 min-w-0">
                          <p className="text-[14px] app-muted truncate max-w-[150px]">{trx.merchant}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 app-chip rounded-lg text-[12px] font-semibold whitespace-nowrap">{trx.category}</span>
                        </td>
                        <td className={`px-6 py-4 text-[15px] font-bold text-right whitespace-nowrap ${trx.type === 'income' ? 'text-[#05A845]' : 'text-red-500'}`}>
                          {trx.type === 'income' ? '' : '-'} {formatIDR(Math.abs(trx.amount))}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-gray-400 group-hover:text-[#1A1A1A] dark:group-hover:text-white transition-colors p-1">
                            {expandedRow === trx.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </td>
                      </tr>

                      {expandedRow === trx.id && (
                        <tr className="bg-gray-50 dark:bg-white/[0.03] border-t-0 animate-in fade-in slide-in-from-top-2 duration-300">
                          <td colSpan="6" className="px-6 pb-6 pt-2">
                            <div className="app-card rounded-xl p-5 flex flex-col md:flex-row justify-between gap-6">
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Catatan Transaksi</p>
                                <p className="text-[#1A1A1A] dark:text-white text-[14px] leading-relaxed mb-4 break-words">{trx.note || '-'}</p>
                                {trx.hasReceipt && (
                                  <button onClick={() => showInfo('Menampilkan bukti/struk transaksi...')} className="flex items-center gap-2 px-3 py-2 app-card-soft rounded-lg text-[#05A845] text-[13px] font-medium hover:bg-[#EAF6ED] dark:hover:bg-[#05A845]/10 hover:border-[#05A845]/30 transition-colors w-fit">
                                    <FileText size={16} /> Lihat Bukti/Struk
                                  </button>
                                )}
                              </div>
                              <div className="flex md:flex-col gap-3 justify-end shrink-0 border-t md:border-t-0 md:border-l app-divider pt-4 md:pt-0 md:pl-6 mt-2 md:mt-0">
                                <button onClick={() => handleEditTransaction(trx)} className="flex items-center justify-center gap-2 px-4 py-2 bg-[#EAF6ED] dark:bg-[#05A845]/10 text-[#05A845] rounded-xl text-[13px] font-semibold hover:bg-[#d1ebd6] dark:hover:bg-[#05A845]/20 transition-colors w-full">
                                  <Pencil size={16} /> Edit Transaksi
                                </button>
                                <button onClick={() => handleDelete(trx.id)} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-[13px] font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors w-full">
                                  <Trash2 size={16} /> Hapus
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 sm:px-6 py-4 border-t app-divider flex flex-col sm:flex-row justify-between items-center gap-4 text-[13px] app-muted bg-white dark:bg-[#1f2028] rounded-b-[24px]">
            <p className="font-medium text-center sm:text-left break-words">
              Menampilkan <span className="font-bold text-[#1A1A1A] dark:text-white">{visibleStart} - {visibleEnd}</span> dari <span className="font-bold text-[#1A1A1A] dark:text-white">{filteredData.length}</span> transaksi
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#2e303a] text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-[#1A1A1A] dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>

              {pageButtons.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold transition-colors ${
                    safeCurrentPage === page
                      ? 'bg-[#05A845] text-white shadow-sm'
                      : 'border border-gray-200 dark:border-[#2e303a] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-[#1A1A1A] dark:hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#2e303a] text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-[#1A1A1A] dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
            </>
          )}
        </div>

      </>
        )}
      </div>

      <TransactionModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        editingData={editingData}
        manualType={manualType}
        setManualType={setManualType}
        nominalInput={nominalInput}
        handleNominalChange={handleNominalChange}
        onSaveTransaction={handleSaveTransaction}
      />

      <SmartAIModal
        isOpen={isSmartOpen}
        onClose={closeSmartModal}
        smartStep={smartStep}
        onFileSelected={handleFileSelected}
        handleSaveSmartAI={handleSaveSmartAI}
        scanResult={scanResult}
        triggerSimulateAI={handleSimulateAI}
      />

      <WhatsAppLinkModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        code={whatsappCode}
        isLoading={whatsappCodeLoading}
        onCreateCode={handleCreateWhatsAppCode}
        onCopyCode={handleCopyWhatsAppCode}
      />

    </AppLayout>
  );
}

function WhatsAppLinkModal({ isOpen, onClose, code, isLoading, onCreateCode, onCopyCode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-[24px] bg-white dark:bg-[#1f2028] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-[#2e303a] px-6 py-5">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[#05A845]">
              <MessageCircle size={21} className="shrink-0" />
              <h2 className="text-[21px] font-bold text-[#1A1A1A] dark:text-white">Hubungkan WhatsApp</h2>
            </div>
            <p className="text-[13px] text-gray-600 dark:text-gray-300">
              Hubungkan nomor WhatsApp ke akun ini untuk input pemasukan dan pengeluaran lewat chat.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1A1A1A] dark:hover:bg-white/[0.06] dark:hover:text-white"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(100vh-190px)] overflow-y-auto px-6 py-5">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Nomor Bot
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-xl border border-emerald-200 bg-white px-4 py-2 font-semibold text-[#1A1A1A] dark:border-emerald-500/25 dark:bg-gray-900/40 dark:text-white">
                    {WHATSAPP_BOT_PHONE_DISPLAY}
                  </span>
                  <a
                    href={`https://wa.me/${WHATSAPP_BOT_PHONE_LINK}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-[#05A845] transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-500/10"
                  >
                    <ExternalLink size={15} />
                    Buka WhatsApp
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={onCreateCode}
                disabled={isLoading}
                className="rounded-xl bg-[#05A845] px-5 py-3 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#048A38] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? 'Membuat...' : 'Buat Kode'}
              </button>
            </div>

            {code && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-white px-4 py-3 dark:border-emerald-500/25 dark:bg-gray-900/40">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Kirim ke WhatsApp bot
                </p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-mono text-[22px] font-bold tracking-wider text-[#1A1A1A] dark:text-white">
                    link {code.code}
                  </p>
                  <button
                    type="button"
                    onClick={onCopyCode}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#05A845] dark:border-[#2e303a] dark:text-gray-300 dark:hover:bg-white/[0.06]"
                  >
                    <Copy size={15} />
                    Salin
                  </button>
                </div>
                <p className="mt-1 text-[12px] text-gray-500 dark:text-gray-400">
                  Kode berlaku 10 menit dan hanya bisa dipakai sekali.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <FormatExample
              title="Contoh Pengeluaran"
              lines={[
                'pengeluaran 50000 makan ayam',
                'keluar 15rb parkir metode tunai'
              ]}
            />
            <FormatExample
              title="Contoh Pemasukan"
              lines={[
                'pemasukan 2jt gaji',
                'masuk 750000 freelance tanggal hari ini'
              ]}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-[13px] text-gray-600 dark:border-[#2e303a] dark:bg-white/[0.04] dark:text-gray-300">
            Kalau format salah, bot akan membalas contoh format. Nominal bisa ditulis sebagai 50000, 15rb, atau 2jt.
          </div>
        </div>
      </div>
    </div>
  );
}

function FormatExample({ title, lines }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 dark:border-[#2e303a] dark:bg-white/[0.03]">
      <p className="mb-3 text-[14px] font-bold text-[#1A1A1A] dark:text-white">{title}</p>
      <div className="space-y-2">
        {lines.map((line) => (
          <p key={line} className="font-mono text-[12px] text-gray-700 dark:text-gray-300">{line}</p>
        ))}
      </div>
    </div>
  );
}
