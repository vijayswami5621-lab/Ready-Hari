import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const useHaptics = () => {
  const hapticImpact = async (style = ImpactStyle.Light) => {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      // Ignore errors on web or unsupported platforms
    }
  };

  const hapticSelection = async () => {
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch (e) {
      // Ignore errors
    }
  };

  const hapticNotification = async (type = 'SUCCESS') => {
    try {
      // Map string 'SUCCESS' to valid enum if NotificationType is available, 
      // but for simplicity we'll just vibrate for notification effect
      await Haptics.vibrate(); 
    } catch (e) {
      // Ignore errors
    }
  };

  return { hapticImpact, hapticSelection, hapticNotification };
};
