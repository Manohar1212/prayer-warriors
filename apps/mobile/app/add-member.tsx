import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Share, View } from 'react-native';

import { toE164 } from '@/features/auth';
import { useMembers, type AddedMember } from '@/features/members';
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
  const [copied, setCopied] = useState(false);

  async function copy() {
    await Clipboard.setStringAsync(member.startingPassword);
    setCopied(true);
  }

  return (
    <View className="flex-1 gap-6">
      <View className="gap-2">
        <Text variant="display" color="primary">
          {member.displayName} is in
        </Text>
        <Text variant="muted" className="text-[15px] leading-[22px]">
          Share these sign-in details with them. The password is shown only once here.
        </Text>
      </View>
      <Card className="gap-3">
        <View className="gap-0.5">
          <Text variant="muted">Email</Text>
          <Text>{member.email}</Text>
        </View>
        {member.phone ? (
          <View className="gap-0.5">
            <Text variant="muted">Mobile</Text>
            <Text>{member.phone}</Text>
          </View>
        ) : null}
        <View className="gap-0.5">
          <Text variant="muted">Starting password</Text>
          <Text className="font-semibold text-[22px] leading-[30px] tracking-[2px]" selectable>
            {member.startingPassword}
          </Text>
        </View>
      </Card>
      <View className="gap-3">
        <Button
          title="Share details"
          onPress={() => Share.share({ message: shareMessage(member) })}
        />
        <Button
          title={copied ? 'Password copied' : 'Copy password'}
          variant="secondary"
          onPress={copy}
        />
      </View>
      <Text variant="muted" className="text-[13px]">
        They can change it any time with "Forgot password" on the sign-in screen.
      </Text>
      <View className="mt-auto">
        <Button title="Done" variant="ghost" onPress={onDone} />
      </View>
    </View>
  );
}

export default function AddMemberScreen() {
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
      setError(err instanceof Error ? err.message : 'Could not add the member.');
    } finally {
      setBusy(false);
    }
  }

  if (added) {
    return (
      <Screen scroll backdrop className="pt-6">
        <AddedView member={added} onDone={() => goBackOr(router, '/(tabs)/community')} />
      </Screen>
    );
  }

  return (
    <Screen scroll backdrop className="gap-8 pt-6">
      <Text variant="muted" className="text-[15px] leading-[22px]">
        They will get a starting password to sign in with, which you share with them.
      </Text>
      <View className="gap-5">
        <Input label="Name" value={displayName} onChangeText={setDisplayName} maxLength={40} autoFocus />
        <Input
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Mobile number (optional)"
          keyboardType="phone-pad"
          value={national}
          onChangeText={setNational}
          error={phoneInvalid ? "That doesn't look like a valid mobile number." : null}
        />
        {phone ? <Text variant="muted">Will be saved as {phone}</Text> : null}
        {error ? (
          <Text variant="muted" color="rose">
            {error}
          </Text>
        ) : null}
        <Button
          title="Add member"
          onPress={submit}
          loading={busy}
          disabled={!canSubmit}
          className="mt-1"
        />
      </View>
    </Screen>
  );
}
