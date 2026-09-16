import * as Sharing from 'expo-sharing';
import { Platform, Share, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/**
 * Shares the verse as a square image through the system sheet (WhatsApp shows up there), and
 * falls back to plain text on web or when the capture is not possible.
 */
export async function shareVerse(card: View | null, text: string, reference: string): Promise<void> {
  const message = `"${text}"\n— ${reference}\n\nPrayer Warriors`;
  if (card && Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
    try {
      const uri = await captureRef(card, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: reference, UTI: 'public.png' });
      return;
    } catch {
      // Fall through to text.
    }
  }
  await Share.share(Platform.OS === 'ios' ? { message } : { message, title: reference });
}
