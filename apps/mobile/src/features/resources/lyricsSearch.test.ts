import { lyricsSearchUrl, youtubeSearchUrl } from './lyricsSearch';

describe('lyrics search urls', () => {
  it('searches Google for Telugu Christian lyrics of a Latin title', () => {
    expect(lyricsSearchUrl('  Yesu   Nadhu Priyudu ')).toBe('https://www.google.com/search?q=Yesu%20Nadhu%20Priyudu%20telugu%20christian%20song%20lyrics');
  });

  it('searches in Telugu when the title is in Telugu script', () => {
    const url = lyricsSearchUrl('నా ప్రాణ ప్రియుడా');
    expect(decodeURIComponent(url)).toBe('https://www.google.com/search?q=నా ప్రాణ ప్రియుడా పాట సాహిత్యం lyrics');
  });

  it('builds a YouTube search for the video link', () => {
    expect(youtubeSearchUrl('Yesu Nadhu Priyudu')).toBe('https://www.youtube.com/results?search_query=Yesu%20Nadhu%20Priyudu%20telugu%20christian%20song');
    expect(decodeURIComponent(youtubeSearchUrl('నా ప్రాణ ప్రియుడా'))).toContain('నా ప్రాణ ప్రియుడా పాట');
  });
});
