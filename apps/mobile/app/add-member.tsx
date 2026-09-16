import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Share, View } from 'react-native';

import { toE164 } from '@/features/auth';
import { useMembers, type AddedMember } from '@/features/members';
import { useLanguage, type TranslationKey } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { Button, Card, Input, Screen, Text } from '@/ui';

function shareMessage(m: AddedMember): string {
  return [
    `Hi ${m.displayName}, you've been added to Prayer Warriors.`,
    '',
    `Sign in with:`,
    `Email: ${m.email}`,
    `Password: ${m.startingPassword}`,
    '',
    'You can change the password any time with "Forgot password".',
  ].join('\n');
}

function AddedView({ member, onDone }: { member: AddedMember; onDone: () => void }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  async function copy() {
    await Clipboard.setStringAsync(member.startingPassword);
    setCopied(true);
  }

  return (
    <View className="flex-1 gap-6">
      <View className="gap-2">
        <Text variant="display" color="primary">
          {t('members.added.title', { name: member.displayName })}
        </Text>
        <Text variant="muted" className="text-[15px] leading-[22px]">
          {t('members.added.intro')}
        </Text>
      </View>
      <Card className="gap-3">
        <View className="gap-0.5">
          <Text variant="muted">{t('common.email')}</Text>
          <Text>{member.email}</Text>
        </View>
        {member.phone ? (
          <View className="gap-0.5">
            <Text variant="muted">{t('common.mobile')}</Text>
            <Text>{member.phone}</Text>
          </View>
        ) : null}
        <View className="gap-0.5">
          <Text variant="muted">{t('members.added.password')}</Text>
          <Text className="font-semibold text-[19px] leading-[26px] tracking-[2px]" selectable>
            {member.startingPassword}
          </Text>
        </View>
      </Card>
      <View className="gap-3">
        <Button
          title={t('members.added.share')}
          onPress={() => Share.share({ message: shareMessage(member) })}
        />
        <Button
          title={copied ? t('members.added.copied') : t('members.added.copy')}
          variant="secondary"
          onPress={copy}
        />
      </View>
      <Text variant="muted" className="text-[13px]">
        {t('members.added.note')}
      </Text>
      <View className="mt-auto">
        <Button title={t('common.done')} variant="ghost" onPress={onDone} />
      </View>
    </View>
  );
}

export default function AddMemberScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { add } = useMembers();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [national, setNational] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<AddedMember | null>(null);

  const phone = national.trim() ? toE164('91', national) : undefined;
  const phoneInvalid = national.trim().length > 0 && !phone;
  const canSubmit = displayName.trim().length > 0 && email.trim().length > 0 && !phoneInvalid;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      setAdded(await add({ displayName, email, phone: phone ?? undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('members.add.failed'));
    } finally {
      setBusy(false);
    }
  }

  if (added) {
    return (
      <Screen edges={['bottom']} scroll backdrop className="pt-6">
        <AddedView member={added} onDone={() => goBackOr(router, '/(tabs)/community')} />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']} scroll backdrop className="gap-8 pt-6">
      <Text variant="muted" className="text-[15px] leading-[22px]">
        {t('members.add.intro')}
      </Text>
      <View className="gap-5">
        <Input label={t('members.add.name')} value={displayName} onChangeText={setDisplayName} maxLength={40} autoFocus />
        <Input
          label={t('common.email')}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label={t('members.add.mobile')}
          keyboardType="phone-pad"
          value={national}
          onChangeText={setNational}
          error={phoneInvalid ? t('members.add.invalidMobile') : null}
        />
        {phone ? <Text variant="muted">{t('members.add.savedAs', { phone })}</Text> : null}
        {error ? (
          <Text variant="muted" color="rose">
            {error}
          </Text>
        ) : null}
        <Button
          title={t('members.add.submit')}
          onPress={submit}
          loading={busy}
          disabled={!canSubmit}
          className="mt-1"
        />
      </View>
    </Screen>
  );
}
