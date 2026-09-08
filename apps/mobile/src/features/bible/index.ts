import { getBibleDb } from '../../lib/bibleDb';
import { createBibleService } from './service';

export const bibleService = createBibleService(getBibleDb);
export { useBibleLanguage } from './useBibleLanguage';
export { bookName, chapterCount } from './types';
export type { BibleBook, BibleLanguage, BibleVerse, SearchHit } from './types';
export { useAttribution, useBooks, useChapter, useSearch } from './useBible';
