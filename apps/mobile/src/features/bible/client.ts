import { getBibleDb } from '../../lib/bibleDb';
import { createBibleService } from './service';

export const bibleService = createBibleService(getBibleDb);
