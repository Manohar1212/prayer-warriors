import { useLocalSearchParams, useRouter } from 'expo-router';

import { findHymn, HYMN_BOOKS, SongReader, type HymnBook } from '@/features/resources';
import { useLanguage } from '@/i18n';
import { useKeepScreenOn } from '@/lib/keepAwake';
import { Screen, Text } from '@/ui';

function isBook(value: unknown): value is HymnBook {
  return HYMN_BOOKS.some((b) => b.id === value);
}

/** A page of one of the bundled books; the screen stays on while singing. */
export default function HymnScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ book?: string; n?: string }>();
  const book: HymnBook = isBook(params.book) ? params.book : 'akk';
  const found = findHymn(book, Number(params.n));
  useKeepScreenOn('hymnal');

  if (!found) {
    return (
      <Screen edges={['bottom']} className="justify-center">
        <Text variant="muted" className="text-center">
          {t('resources.detail.notAvailable')}
        </Text>
      </Screen>
    );
  }

  const { hymn, previous, next } = found;
  const bookLabel = t(HYMN_BOOKS.find((b) => b.id === book)?.label ?? 'resources.book.akk');
  const open = (n: number) => router.setParams({ n: String(n) });

  return (
    <Screen edges={['bottom']} scroll className="pt-4">
      <SongReader
        number={hymn.n}
        title={hymn.title}
        subtitle={bookLabel}
        body={hymn.body}
        numberLabel={t('resources.song.number', { n: hymn.n })}
        previous={previous ? { number: previous.n, title: previous.title } : null}
        next={next ? { number: next.n, title: next.title } : null}
        onPrevious={() => previous && open(previous.n)}
        onNext={() => next && open(next.n)}
        labels={{ smaller: t('resources.song.smaller'), larger: t('resources.song.larger'), previous: t('resources.song.previous'), next: t('resources.song.next') }}
      />
    </Screen>
  );
}
