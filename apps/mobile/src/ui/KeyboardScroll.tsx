import { cssInterop } from 'nativewind';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

// Let Tailwind classes reach the keyboard-aware list the same way they reach ScrollView.
cssInterop(KeyboardAwareScrollView, { className: 'style', contentContainerClassName: 'contentContainerStyle' });

/**
 * A scroll view that scrolls the focused field above the keyboard and keeps `bottomOffset` points
 * of room under it, so the button that follows a field stays visible while typing.
 */
export const KeyboardScroll = KeyboardAwareScrollView;
