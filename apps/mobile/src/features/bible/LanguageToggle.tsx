import { Segments } from '../../ui/Segments';
import type { BibleLanguage } from './types';

export function LanguageToggle({ value, onChange }: { value: BibleLanguage; onChange: (l: BibleLanguage) => void }) {
  return (
    <Segments
      options={[
        { value: 'en', label: 'English' },
        { value: 'te', label: 'తెలుగు' },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}
