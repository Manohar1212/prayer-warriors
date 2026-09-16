import { Platform, Share } from 'react-native';

const mockIsAvailableAsync = jest.fn();
const mockShareAsync = jest.fn();
const mockCaptureRef = jest.fn();
jest.mock('expo-sharing', () => ({ isAvailableAsync: (...a: unknown[]) => mockIsAvailableAsync(...a), shareAsync: (...a: unknown[]) => mockShareAsync(...a) }));
jest.mock('react-native-view-shot', () => ({ captureRef: (...a: unknown[]) => mockCaptureRef(...a) }));

import { shareVerse } from './shareVerse';

const card = {} as never;

describe('shareVerse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
  });

  it('shares the captured card as an image when sharing is available', async () => {
    mockIsAvailableAsync.mockResolvedValue(true);
    mockCaptureRef.mockResolvedValue('file:///tmp/verse.png');
    await shareVerse(card, 'Come to Me', 'Matthew 11:28');
    expect(mockShareAsync).toHaveBeenCalledWith('file:///tmp/verse.png', expect.objectContaining({ mimeType: 'image/png' }));
    expect(Share.share).not.toHaveBeenCalled();
  });

  it('falls back to text when the capture fails', async () => {
    mockIsAvailableAsync.mockResolvedValue(true);
    mockCaptureRef.mockRejectedValue(new Error('no view'));
    await shareVerse(card, 'Come to Me', 'Matthew 11:28');
    expect(mockShareAsync).not.toHaveBeenCalled();
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Matthew 11:28') }));
  });

  it('shares text when there is no card to capture', async () => {
    mockIsAvailableAsync.mockResolvedValue(true);
    await shareVerse(null, 'Come to Me', 'Matthew 11:28');
    expect(mockCaptureRef).not.toHaveBeenCalled();
    expect(Share.share).toHaveBeenCalled();
  });

  it('shares text on web', async () => {
    const os = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    try {
      await shareVerse(card, 'Come to Me', 'Matthew 11:28');
      expect(mockIsAvailableAsync).not.toHaveBeenCalled();
      expect(Share.share).toHaveBeenCalled();
    } finally {
      Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
    }
  });
});
