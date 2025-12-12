import { Platform, Alert } from 'react-native';

/**
 * Platform-aware alert utility
 * Uses native Alert on mobile, window.confirm/alert on web
 */
export const showAlert = (title, message, buttons = []) => {
  if (Platform.OS === 'web') {
    // On web, use browser's native confirm/alert
    if (buttons.length === 0) {
      // Simple alert
      window.alert(`${title}\n\n${message}`);
      return;
    }

    // For confirm dialogs, use window.confirm
    if (buttons.length === 2) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        // Find the non-cancel button and call its onPress
        const confirmButton = buttons.find(btn => btn.style !== 'cancel');
        if (confirmButton && confirmButton.onPress) {
          confirmButton.onPress();
        }
      } else {
        // Find cancel button and call its onPress
        const cancelButton = buttons.find(btn => btn.style === 'cancel');
        if (cancelButton && cancelButton.onPress) {
          cancelButton.onPress();
        }
      }
      return;
    }

    // For single button, just call onPress
    if (buttons.length === 1 && buttons[0].onPress) {
      buttons[0].onPress();
      return;
    }
  }

  // On mobile, use React Native Alert
  Alert.alert(title, message, buttons);
};

export default showAlert;


