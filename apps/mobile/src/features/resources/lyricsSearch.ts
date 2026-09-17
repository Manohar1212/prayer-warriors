/**
 * Web searches for a song the member is sharing. Lyrics of Telugu Christian songs live on
 * lyrics sites and YouTube rather than in any free API, so the app opens a search in the
 * browser and the member pastes what they find.
 */

const TELUGU = /[ఀ-౿]/;

function query(title: string, latinSuffix: string, teluguSuffix: string): string {
  const clean = title.trim().replace(/\s+/g, ' ');
  return `${clean} ${TELUGU.test(clean) ? teluguSuffix : latinSuffix}`;
}

/** Google search for the song's lyrics; a Telugu title searches in Telugu. */
export function lyricsSearchUrl(title: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query(title, 'telugu christian song lyrics', 'పాట సాహిత్యం lyrics'))}`;
}

/** YouTube search for the song, to find a link to share. */
export function youtubeSearchUrl(title: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query(title, 'telugu christian song', 'పాట'))}`;
}
