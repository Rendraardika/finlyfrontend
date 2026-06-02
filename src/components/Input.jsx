import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({ label, id, type = 'text', ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-semibold text-[#1A1A1A] dark:text-white mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          className="w-full px-4 py-3 border border-gray-200 dark:border-[#2e303a] rounded-xl bg-white dark:bg-[#161616] text-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EAF6ED] dark:focus:ring-[#05A845]/20 focus:border-[#05A845] transition-all text-[15px] placeholder:text-gray-400 dark:placeholder:text-gray-500"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#05A845] transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}