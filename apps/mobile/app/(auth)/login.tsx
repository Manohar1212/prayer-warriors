import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { useAuth } from '@/features/auth';
import { Button, Input, Text } from '@/ui';
import { AuthShell } from '@/ui/AuthShell';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      backTo="/(auth)/welcome"
      title="Welcome back"
      subtitle="Sign in with the email your group admin added."
      footer={
        <Text variant="caption" color="creamFaint" className="text-center">
          Membership is by invitation from your group admin.
        </Text>
      }
    >
      <Input
        label="Email"
        variant="glass"
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label="Password"
        variant="glass"
        placeholder="Your password"
        secureTextEntry={!show}
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={submit}
        error={error}
        right={
          <Pressable accessibilityRole="button" accessibilityLabel={show ? 'Hide password' : 'Show password'} onPress={() => setShow((s) => !s)} hitSlop={8}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(250, 247, 240, 0.7)" />
          </Pressable>
        }
      />
      <Button title="Sign in" variant="inverse" onPress={submit} loading={busy} disabled={!email.trim() || !password} className="mt-1" />
      <Link href="/(auth)/forgot-password" asChild>
        <Pressable accessibilityRole="link" className="self-center py-1">
          <Text variant="label" color="creamSoft" className="text-[14px]">
            Forgot your password?
          </Text>
        </Pressable>
      </Link>
    </AuthShell>
  );
}
