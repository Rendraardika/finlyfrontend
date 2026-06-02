import { useEffect } from 'react';

export default function useClickOutside(ref, onOutsideClick, active = true) {
  useEffect(() => {
    if (!active) return undefined;

    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutsideClick?.();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onOutsideClick?.();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [active, onOutsideClick, ref]);
}
