import { useEffect, useCallback } from 'react';

interface UseFormShortcutsOptions {
  onSave: () => void;
  onSaveAndReset: () => void;
  enabled?: boolean;
}

export const useFormShortcuts = ({ onSave, onSaveAndReset, enabled = true }: UseFormShortcutsOptions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // F8: 저장
    if (event.key === 'F8') {
      event.preventDefault();
      onSave();
    }
    // F9: 저장 후 초기화
    if (event.key === 'F9') {
      event.preventDefault();
      onSaveAndReset();
    }
  }, [onSave, onSaveAndReset, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export default useFormShortcuts;
