import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Custom hook for keyboard shortcuts (web only)
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) {
      return;
    }

    const handleKeyDown = (event) => {
      const key = event.key;
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Check each shortcut
      for (const shortcut of shortcuts) {
        const { key: shortcutKey, ctrl, cmd, shift, alt, handler } = shortcut;
        
        // Check modifier keys
        const ctrlMatch = ctrl ? ctrlOrCmd : !ctrlOrCmd;
        const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
        const altMatch = alt ? event.altKey : !event.altKey;
        
        // Check if key matches
        const keyMatch = shortcutKey.toLowerCase() === key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          handler(event);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}

/**
 * Common keyboard shortcuts for the app
 */
export const commonShortcuts = {
  search: { key: 'k', ctrl: true, handler: () => {} },
  newTournament: { key: 'n', ctrl: true, handler: () => {} },
  newTeam: { key: 't', ctrl: true, handler: () => {} },
  closeModal: { key: 'Escape', handler: () => {} },
  navigateUp: { key: 'ArrowUp', handler: () => {} },
  navigateDown: { key: 'ArrowDown', handler: () => {} },
};

export default useKeyboardShortcuts;


