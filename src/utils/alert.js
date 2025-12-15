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
    if (buttons.length >= 2) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        // Find the non-cancel button (usually the last one or the one without 'cancel' style)
        const confirmButton = buttons.find(btn => btn.style !== 'cancel') || buttons[buttons.length - 1];
        if (confirmButton && confirmButton.onPress) {
          try {
            confirmButton.onPress();
          } catch (error) {
            console.error('Error in alert button onPress:', error);
            window.alert(`Error: ${error.message}`);
          }
        }
      } else {
        // Find cancel button and call its onPress if it exists
        const cancelButton = buttons.find(btn => btn.style === 'cancel');
        if (cancelButton && cancelButton.onPress) {
          try {
            cancelButton.onPress();
          } catch (error) {
            console.error('Error in cancel button onPress:', error);
          }
        }
      }
      return;
    }

    // For single button, just call onPress
    if (buttons.length === 1 && buttons[0].onPress) {
      try {
        buttons[0].onPress();
      } catch (error) {
        console.error('Error in alert button onPress:', error);
        window.alert(`Error: ${error.message}`);
      }
      return;
    }
  }

  // On mobile, use React Native Alert
  Alert.alert(title, message, buttons);
};

export default showAlert;


