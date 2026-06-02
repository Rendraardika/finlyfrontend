import { useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import useClickOutside from '../../hooks/useClickOutside';

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi',
  className = '',
  buttonClassName = '',
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Cari opsi...',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = searchable && query.trim()
    ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  useClickOutside(ref, () => setOpen(false), open);

  const handleSelect = (nextValue) => {
    onChange?.(nextValue);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((prev) => !prev);
          setQuery('');
        }}
        className={`w-full h-12 px-4 pr-10 rounded-xl border text-left text-[14px] font-medium app-input transition-all disabled:opacity-60 disabled:cursor-not-allowed ${buttonClassName}`}
      >
        <span className={selectedOption ? 'block truncate' : 'block truncate text-gray-400 dark:text-gray-500'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${open ? 'rotate-180 text-[#05A845]' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-[120] mt-2 w-full overflow-hidden rounded-xl app-dropdown animate-in fade-in zoom-in-95"
        >
          {searchable && (
            <div className="p-2 border-b border-gray-100 dark:border-[#2e303a]">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-100 dark:border-[#2e303a] bg-white dark:bg-[#161616] text-[13px] font-medium text-[#1A1A1A] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#05A845] focus:ring-2 focus:ring-[#05A845]/10"
                  autoFocus
                />
              </div>
            </div>
          )}
          <div className="max-h-72 overflow-y-auto">
            {filteredOptions.map((option) => {
              const selected = option.value === value;

              return (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={option.disabled}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  className={`w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${
                    selected
                      ? 'text-[#05A845] bg-[#EAF6ED]/50 dark:bg-[#05A845]/10'
                      : option.disabled
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-3 text-[13px] font-medium text-gray-400 dark:text-gray-500">
                Tidak ada hasil
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
