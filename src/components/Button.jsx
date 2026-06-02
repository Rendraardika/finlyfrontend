export default function Button({ children, isLoading, className = '', ...props }) {
  return (
    <button
      disabled={isLoading}
      className={`w-full bg-[#05A845] hover:bg-[#048A38] disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold py-3 rounded-xl transition duration-200 text-[15px] ${className}`}
      {...props}
    >
      {isLoading ? 'Processing...' : children}
    </button>
  );
}