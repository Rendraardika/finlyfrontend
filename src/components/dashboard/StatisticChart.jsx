import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import useClickOutside from '../../hooks/useClickOutside';

const emptyChart = { total: 0, data: [] };

export default function StatistikChart({ formatIDR, chartDataSources = {} }) {
  const [chartType, setChartType] = useState('pengeluaran');
  const [chartPeriod, setChartPeriod] = useState('bulan');
  const [activeSlice, setActiveSlice] = useState(null);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const periodDropdownRef = useRef(null);

  useClickOutside(periodDropdownRef, () => setIsPeriodDropdownOpen(false), isPeriodDropdownOpen);

  const currentChart = chartDataSources[chartType] || emptyChart;
  const currentChartData = currentChart.data || [];
  let currentOffset = 25;

  return (
    <div className="bg-white dark:bg-[#1f2028] rounded-[24px] p-5 sm:p-8 border border-gray-100 dark:border-[#2e303a] shadow-sm flex flex-col items-center min-w-0">
      <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div className="flex bg-gray-100 dark:bg-white/[0.08] p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => {
              setChartType('pengeluaran');
              setActiveSlice(null);
            }}
            className={`flex-1 sm:flex-none px-3 py-1.5 text-[12px] font-bold rounded-md transition-all ${chartType === 'pengeluaran' ? 'bg-white dark:bg-[#2a2d36] text-red-500 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => {
              setChartType('pemasukan');
              setActiveSlice(null);
            }}
            className={`flex-1 sm:flex-none px-3 py-1.5 text-[12px] font-bold rounded-md transition-all ${chartType === 'pemasukan' ? 'bg-white dark:bg-[#2a2d36] text-[#05A845] shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Pemasukan
          </button>
        </div>

        <div ref={periodDropdownRef} className="relative self-end sm:self-auto">
          <button
            onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
            className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 dark:text-gray-400 bg-transparent hover:text-[#1A1A1A] dark:hover:text-white transition-colors"
          >
            {chartPeriod === 'minggu' ? 'Mingguan' : chartPeriod === 'bulan' ? 'Bulanan' : 'Tahunan'}
            <ChevronDown size={14} className={`transform transition-transform ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isPeriodDropdownOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-[#252832] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-[#2e303a] overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
              {['minggu', 'bulan', 'tahun'].map((period) => (
                <div
                  key={period}
                  onClick={() => {
                    setChartPeriod(period);
                    setIsPeriodDropdownOpen(false);
                  }}
                  className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors ${chartPeriod === period ? 'text-[#05A845] bg-[#EAF6ED]/50 dark:bg-[#05A845]/10' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  {period === 'minggu' ? 'Mingguan' : period === 'bulan' ? 'Bulanan' : 'Tahunan'}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-8 flex items-center justify-center">
        {currentChartData.length > 0 ? (
          <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90 drop-shadow-sm">
            {currentChartData.map((slice) => {
              const strokeDasharray = `${slice.percent} ${100 - slice.percent}`;
              const offset = currentOffset;
              currentOffset -= slice.percent;

              return (
                <circle
                  key={slice.id}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={activeSlice?.id === slice.id ? '8' : '6'}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={offset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setActiveSlice(slice)}
                  onMouseLeave={() => setActiveSlice(null)}
                />
              );
            })}
          </svg>
        ) : (
          <div className="w-full h-full rounded-full border-[14px] border-gray-100 dark:border-white/[0.08]" />
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none min-w-0">
          {activeSlice ? (
            <>
              <span className="text-gray-400 dark:text-gray-500 text-[10px] font-bold tracking-wider uppercase mb-0.5 text-center px-4 leading-tight break-words">
                {activeSlice.label}
              </span>
              <span className="text-[#1A1A1A] dark:text-white font-bold text-[14px]">
                {activeSlice.percent}%
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold mt-0.5 break-words text-center px-3">
                {formatIDR(activeSlice.amount)}
              </span>
            </>
          ) : (
            <>
              <span className="text-gray-400 dark:text-gray-500 text-[11px] font-bold tracking-wider mb-0.5">
                TOTAL
              </span>
              <span className="text-[#1A1A1A] dark:text-white font-bold text-[15px]">
                {formatIDR(currentChart.total)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="w-full space-y-3">
        {currentChartData.length === 0 ? (
          <p className="text-center text-[13px] text-gray-400 dark:text-gray-500">Belum ada data untuk periode ini</p>
        ) : (
          currentChartData.map((slice) => (
            <div
              key={slice.id}
              className={`flex items-center justify-between gap-3 text-[13px] px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${activeSlice?.id === slice.id ? 'bg-gray-50 dark:bg-white/[0.04]' : ''}`}
              onMouseEnter={() => setActiveSlice(slice)}
              onMouseLeave={() => setActiveSlice(null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></div>
                <span className={`font-medium transition-colors truncate ${activeSlice?.id === slice.id ? 'text-[#1A1A1A] dark:text-white' : 'text-[#666666] dark:text-gray-400'}`}>
                  {slice.label}
                </span>
              </div>
              <span className="font-bold text-[#1A1A1A] dark:text-white shrink-0">
                {slice.percent}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
