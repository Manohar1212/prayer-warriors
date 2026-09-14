import { useT } from '../../i18n';
import { Segments } from '../../ui/Segments';
import type { BibleLanguage } from './types';

export function LanguageToggle({ value, onChange }: { value: BibleLanguage; onChange: (l: BibleLanguage) => void }) {
  const t = useT();
  return (
    <Segments
      options={[
        { value: 'en', label: t('bible.english') },
        { value: 'te', label: t('bible.telugu') },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}
