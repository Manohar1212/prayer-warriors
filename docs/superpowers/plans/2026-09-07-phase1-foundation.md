# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the single-screen prototype into the Phase 1 foundation: an npm-workspace monorepo whose Expo app can sign in against a dedicated Back4App app and navigate the five tabs.

**Architecture:** The Expo app moves to `apps/mobile` and gets Expo Router (auth stack + tabs, gated by `Stack.Protected`), a NativeWind design system with the plan's tokens, and an `AuthProvider` that wraps a small typed `AuthService` built on the Parse JS SDK. Back4App schema, roles, and the first group are created by an idempotent script in `backend/schema`.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript 6, Expo Router 57, NativeWind 4.2 + Tailwind 3.4, Parse JS SDK 8 (`parse/react-native`), AsyncStorage, jest-expo + @testing-library/react-native, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-07-phase1-foundation-design.md` (read it first; it lists the deviations from `docs/Prayer_Warriors_Product_Technical_Plan.md`).

## Global Constraints

- Expo SDK `~57.0.20`, React Native `0.86.3`, React `19.2.3`, TypeScript `~6.0.3` — do not change.
- Always add native/Expo packages with `npx expo install <pkg>` (from `apps/mobile`) so SDK-compatible versions are chosen; pure-JS packages with `npm install`.
- NativeWind `4.2.6` requires `tailwindcss@3.4.19` — never Tailwind 4.
- Colors are exactly: `primary #173E32`, `primaryDark #0E2A22`, `gold #B98224`, `goldLight #E7C46A`, `cream #FAF7F0`, `surface #FFFFFF`, `rose #D99A9A`, `ink #202521`, `muted #70756F`, `border #E6E0D5`.
- Screens never import `parse` directly; only `src/lib/parse.ts` and `src/features/auth/service.ts` may.
- No public signup UI. No engagement metrics. Touch targets ≥ 48px.
- Public keys go in `EXPO_PUBLIC_PARSE_APP_ID`, `EXPO_PUBLIC_PARSE_JS_KEY`, `EXPO_PUBLIC_PARSE_SERVER_URL`; the master key is only ever read by `backend/schema/setup.mjs` from `PARSE_MASTER_KEY`.
- `@testing-library/react-native` 14 is async by default: `await render(...)`, `await fireEvent.press(...)`, `await renderHook(...)`. Test code in this plan that omits the `await` must be awaited when written.
- `jest.config.js` keeps jest-expo's default `transformIgnorePatterns`; a custom pattern ending in `/)` breaks `expo-modules-core` in the monorepo.
- Every task ends with `npm run typecheck` and `npm test` green from the repo root, then a commit.
- Commit messages end with:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_016XNfgW3g8GyXyYJvQ4beLd
  ```

---

## File structure (end state)

```
prayer-warriors/
├── package.json                    npm workspaces root (scripts fan out to apps/*)
├── .github/workflows/ci.yml        typecheck + test
├── backend/
│   ├── schema/setup.mjs            idempotent Back4App schema/roles/first-group script
│   ├── cloud/main.js               Cloud Code placeholder
│   └── README.md
├── docs/…
└── apps/mobile/
    ├── package.json                main: expo-router/entry
    ├── app.json                    scheme + expo-router plugin
    ├── babel.config.js, metro.config.js, tailwind.config.js, global.css, nativewind-env.d.ts
    ├── jest.config.js, jest.setup.ts
    ├── app/
    │   ├── _layout.tsx             fonts, AuthProvider, Stack.Protected gates
    │   ├── account-setup.tsx       first-login display name
    │   ├── profile.tsx             modal: user info + sign out
    │   ├── (auth)/_layout.tsx, welcome.tsx, login.tsx, forgot-password.tsx
    │   └── (tabs)/_layout.tsx, index.tsx, prayer.tsx, community.tsx, resources.tsx, funds.tsx
    └── src/
        ├── config.ts               EXPO_PUBLIC_* reader
        ├── lib/parse.ts            Parse SDK init (AsyncStorage)
        ├── theme/tokens.ts         colors + font names (single source for tailwind + native)
        ├── ui/                     Screen, Card, Button, Input, Text (+ tests)
        └── features/auth/
            ├── types.ts            AuthUser, AuthService, ParseLike
            ├── errors.ts           mapParseError
            ├── service.ts          createParseAuthService
            ├── gate.ts             resolveGate
            ├── AuthProvider.tsx    context + useAuth
            └── *.test.ts(x)
```

---

### Task 1: Move the app into an npm workspace and add CI

**Files:**
- Create: `package.json` (root), `.github/workflows/ci.yml`
- Move: everything Expo-related from repo root into `apps/mobile/` (`App.tsx`, `index.ts`, `app.json`, `tsconfig.json`, `assets/`, `src/`, `.env`, `.env.example`, `package.json`, `package-lock.json` → deleted and regenerated at root)
- Modify: `.gitignore` (root, keep), `README.md` (paths)
- Keep at root: `docs/`, `scripts/` (moves in Task 6), `LICENSE`, `AGENTS.md`, `CLAUDE.md`, `.claude/`

**Interfaces:**
- Produces: root scripts `npm run typecheck`, `npm test`, `npm run mobile` that later tasks and CI use.

- [ ] **Step 1: Move the app**

```bash
mkdir -p apps/mobile
git mv App.tsx index.ts app.json tsconfig.json assets src package.json apps/mobile/
git mv .env.example apps/mobile/.env.example
mv .env apps/mobile/.env
git rm -q package-lock.json
rm -rf node_modules
```

- [ ] **Step 2: Write the root package.json**

```json
{
  "name": "prayer-warriors",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "mobile": "npm start -w apps/mobile",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "test": "npm test --workspaces --if-present -- --ci"
  },
  "engines": { "node": ">=20" }
}
```

- [ ] **Step 3: Install from root and verify the existing prototype still passes**

```bash
npm install
npm run typecheck
npm test
```
Expected: typecheck clean; `Tests: 6 passed`.

- [ ] **Step 4: Add the CI workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
```

- [ ] **Step 5: Fix README paths**

In `README.md`, change the Setup step 4 block to:
```bash
npm install          # from the repo root
npm run mobile       # then press i / a / w
```
and prefix every path in "Project layout" with `apps/mobile/`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: move Expo app to apps/mobile workspace and add CI"
```

---

### Task 2: Design system — NativeWind, fonts, tokens, UI primitives

**Files:**
- Create: `apps/mobile/babel.config.js`, `apps/mobile/metro.config.js`, `apps/mobile/tailwind.config.js`, `apps/mobile/global.css`, `apps/mobile/nativewind-env.d.ts`, `apps/mobile/jest.config.js`, `apps/mobile/jest.setup.ts`
- Create: `apps/mobile/src/theme/tokens.ts`, `apps/mobile/src/ui/Text.tsx`, `Button.tsx`, `Input.tsx`, `Card.tsx`, `Screen.tsx`, `index.ts`
- Test: `apps/mobile/src/ui/Button.test.tsx`, `apps/mobile/src/ui/Input.test.tsx`
- Modify: `apps/mobile/package.json` (remove `"jest"` key; add deps), `apps/mobile/tsconfig.json`

**Interfaces:**
- Produces:
  - `tokens.colors` (the 10 hex values) and `tokens.fonts = { display: 'PlayfairDisplay_600SemiBold', displayBold: 'PlayfairDisplay_700Bold', sans: 'Inter_400Regular', sansMedium: 'Inter_500Medium', sansSemiBold: 'Inter_600SemiBold' }`
  - `<Text variant="display"|"title"|"body"|"muted"|"label" className?>`
  - `<Button title variant="primary"|"secondary"|"ghost" onPress loading? disabled? className?>`
  - `<Input label? error? ...TextInputProps>`
  - `<Card className?>{children}</Card>`
  - `<Screen scroll? className?>{children}</Screen>`

- [ ] **Step 1: Install packages (run inside `apps/mobile`)**

```bash
cd apps/mobile
npx expo install nativewind react-native-reanimated react-native-worklets react-native-safe-area-context expo-font @expo-google-fonts/playfair-display @expo-google-fonts/inter
npm install -D tailwindcss@3.4.19 @testing-library/react-native
cd ../..
```

- [ ] **Step 2: Config files**

`apps/mobile/babel.config.js`:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
```

`apps/mobile/metro.config.js`:
```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });
```

`apps/mobile/global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`apps/mobile/nativewind-env.d.ts`:
```ts
/// <reference types="nativewind/types" />
```

`apps/mobile/src/theme/tokens.ts`:
```ts
export const colors = {
  primary: '#173E32',
  primaryDark: '#0E2A22',
  gold: '#B98224',
  goldLight: '#E7C46A',
  cream: '#FAF7F0',
  surface: '#FFFFFF',
  rose: '#D99A9A',
  ink: '#202521',
  muted: '#70756F',
  border: '#E6E0D5',
} as const;

export const fonts = {
  display: 'PlayfairDisplay_600SemiBold',
  displayBold: 'PlayfairDisplay_700Bold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
} as const;
```

`apps/mobile/tailwind.config.js` (Tailwind loads this with plain Node, so the values are inlined; keep them in sync with `src/theme/tokens.ts`):
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Mirror of src/theme/tokens.ts
      colors: {
        primary: { DEFAULT: '#173E32', dark: '#0E2A22' },
        gold: { DEFAULT: '#B98224', light: '#E7C46A' },
        cream: '#FAF7F0',
        surface: '#FFFFFF',
        rose: '#D99A9A',
        ink: '#202521',
        muted: '#70756F',
        border: '#E6E0D5',
      },
      fontFamily: {
        display: ['PlayfairDisplay_600SemiBold'],
        'display-bold': ['PlayfairDisplay_700Bold'],
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
      },
    },
  },
  plugins: [],
};
```

`apps/mobile/jest.config.js` (Task 3 adds a `setupFiles` entry once gesture-handler is installed):
```js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|nativewind|react-native-css-interop)/)',
  ],
};
```

Remove the `"jest": {...}` block from `apps/mobile/package.json` (jest.config.js replaces it).

`apps/mobile/tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "types": ["jest", "nativewind/types"],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", "nativewind-env.d.ts"]
}
```

- [ ] **Step 3: Write the failing Button and Input tests**

`apps/mobile/src/ui/Button.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';

describe('Button', () => {
  it('calls onPress with its title', () => {
    const onPress = jest.fn();
    render(<Button title="Sign in" onPress={onPress} />);
    fireEvent.press(screen.getByText('Sign in'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', () => {
    const onPress = jest.fn();
    render(<Button title="Sign in" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('Sign in'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a spinner and blocks presses while loading', () => {
    const onPress = jest.fn();
    render(<Button title="Sign in" onPress={onPress} loading />);
    expect(screen.getByTestId('button-spinner')).toBeTruthy();
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

`apps/mobile/src/ui/Input.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Input } from './Input';

describe('Input', () => {
  it('renders label and forwards text changes', () => {
    const onChangeText = jest.fn();
    render(<Input label="Email" placeholder="you@example.com" onChangeText={onChangeText} />);
    expect(screen.getByText('Email')).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'a@b.c');
    expect(onChangeText).toHaveBeenCalledWith('a@b.c');
  });

  it('shows an error message when given', () => {
    render(<Input label="Password" error="Incorrect email or password." />);
    expect(screen.getByText('Incorrect email or password.')).toBeTruthy();
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm test -w apps/mobile`
Expected: both suites fail with "Cannot find module './Button'" / "'./Input'".

- [ ] **Step 5: Implement the primitives**

`apps/mobile/src/ui/Text.tsx`:
```tsx
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

export type TextVariant = 'display' | 'title' | 'body' | 'muted' | 'label';

const variantClass: Record<TextVariant, string> = {
  display: 'font-display text-3xl text-ink',
  title: 'font-semibold text-lg text-ink',
  body: 'font-sans text-base text-ink leading-6',
  muted: 'font-sans text-sm text-muted',
  label: 'font-medium text-sm text-ink',
};

export type TextProps = RNTextProps & { variant?: TextVariant; className?: string };

export function Text({ variant = 'body', className = '', ...rest }: TextProps) {
  return <RNText className={`${variantClass[variant]} ${className}`} {...rest} />;
}
```

`apps/mobile/src/ui/Button.tsx`:
```tsx
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { colors } from '../theme/tokens';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
};

const container: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface border border-primary',
  ghost: 'bg-transparent',
};

const label: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-primary',
  ghost: 'text-primary',
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  ...rest
}: Props) {
  const blocked = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      className={`min-h-12 items-center justify-center rounded-xl px-5 py-3 active:opacity-80 ${container[variant]} ${blocked ? 'opacity-50' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          testID="button-spinner"
          color={variant === 'primary' ? colors.surface : colors.primary}
        />
      ) : (
        <Text variant="label" className={`text-base font-semibold ${label[variant]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
```

`apps/mobile/src/ui/Input.tsx`:
```tsx
import { TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '../theme/tokens';
import { Text } from './Text';

type Props = TextInputProps & { label?: string; error?: string | null; className?: string };

export function Input({ label, error, className = '', ...rest }: Props) {
  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? <Text variant="label">{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        className={`min-h-12 rounded-xl border bg-surface px-4 py-3 font-sans text-base text-ink ${
          error ? 'border-rose' : 'border-border'
        }`}
        {...rest}
      />
      {error ? <Text className="text-sm text-rose">{error}</Text> : null}
    </View>
  );
}
```

`apps/mobile/src/ui/Card.tsx`:
```tsx
import { View, type ViewProps } from 'react-native';

export function Card({ className = '', ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      className={`rounded-2xl border border-border bg-surface p-4 shadow-sm shadow-ink/5 ${className}`}
      {...rest}
    />
  );
}
```

`apps/mobile/src/ui/Screen.tsx`:
```tsx
import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = PropsWithChildren<{ scroll?: boolean; className?: string }>;

export function Screen({ children, scroll = false, className = '' }: Props) {
  const body = scroll ? (
    <ScrollView
      contentContainerClassName={`flex-grow p-5 ${className}`}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 p-5 ${className}`}>{children}</View>
  );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.cream }}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```
(`SafeAreaView` comes from a third-party package that NativeWind does not wrap by default, so it takes a plain `style`.) Add `import { colors } from '../theme/tokens';` at the top of `Screen.tsx`.

`apps/mobile/src/ui/index.ts`:
```ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { Screen } from './Screen';
export { Text } from './Text';
```

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test -w apps/mobile && npm run typecheck -w apps/mobile`
Expected: Button (3) + Input (2) + prototype (6) = 11 passed; tsc clean.
If NativeWind's `className` breaks the jest render with "Cannot read properties of undefined (reading 'cssInterop')", add `nativewind` to `transformIgnorePatterns` (it already is) and confirm `babel.config.js` has the `nativewind/babel` preset — jest-expo uses it.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(mobile): add NativeWind design system with tokens and UI primitives"
```

---

### Task 3: Expo Router skeleton — auth stack and five tabs, prototype removed

**Files:**
- Delete: `apps/mobile/App.tsx`, `apps/mobile/index.ts`, `apps/mobile/src/api/`, `apps/mobile/src/hooks/`, `apps/mobile/src/components/`, `apps/mobile/src/theme.ts`
- Create: `apps/mobile/app/_layout.tsx`, `apps/mobile/app/(auth)/_layout.tsx`, `welcome.tsx`, `login.tsx`, `forgot-password.tsx`, `apps/mobile/app/(tabs)/_layout.tsx`, `index.tsx`, `prayer.tsx`, `community.tsx`, `resources.tsx`, `funds.tsx`, `apps/mobile/app/profile.tsx`, `apps/mobile/app/account-setup.tsx`
- Create: `apps/mobile/src/ui/Placeholder.tsx`
- Modify: `apps/mobile/package.json` (`main`), `apps/mobile/app.json`

**Interfaces:**
- Consumes: `Screen`, `Text`, `Button`, `Input` from `@/ui`; `colors`, `fonts` from `@/theme/tokens`.
- Produces: route names `/(auth)/welcome`, `/(auth)/login`, `/(auth)/forgot-password`, `/(tabs)`, `/profile`, `/account-setup`. Screens in this task are static; Task 5 wires them to auth.

- [ ] **Step 1: Install router packages (inside `apps/mobile`)**

```bash
cd apps/mobile
npx expo install expo-router expo-linking expo-constants expo-splash-screen react-native-screens react-native-gesture-handler @expo/metro-runtime
cd ../..
```
Then in `apps/mobile/package.json` set `"main": "expo-router/entry"` and delete `App.tsx` and `index.ts`.

- [ ] **Step 2: app.json**

Replace `apps/mobile/app.json` with:
```json
{
  "expo": {
    "name": "Prayer Warriors",
    "slug": "prayer-warriors",
    "scheme": "prayerwarriors",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": { "image": "./assets/splash-icon.png", "resizeMode": "contain", "backgroundColor": "#FAF7F0" },
    "ios": { "supportsTablet": false, "bundleIdentifier": "com.prayerwarriors.app" },
    "android": {
      "package": "com.prayerwarriors.app",
      "adaptiveIcon": {
        "backgroundColor": "#FAF7F0",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      },
      "predictiveBackGestureEnabled": false
    },
    "web": { "favicon": "./assets/favicon.png", "bundler": "metro" },
    "plugins": ["expo-router", "expo-font"]
  }
}
```
Confirm `assets/splash-icon.png` exists (`ls apps/mobile/assets`); if not, use `./assets/icon.png` for the splash image.

Then enable the gesture-handler jest shim now that the package exists. `apps/mobile/jest.setup.ts`:
```ts
import 'react-native-gesture-handler/jestSetup';
```
and add `setupFiles: ['<rootDir>/jest.setup.ts'],` to `apps/mobile/jest.config.js` after the `preset` line.

- [ ] **Step 3: Delete the prototype code**

```bash
git rm -rq apps/mobile/src/api apps/mobile/src/hooks apps/mobile/src/components apps/mobile/src/theme.ts
```

- [ ] **Step 4: Placeholder component**

`apps/mobile/src/ui/Placeholder.tsx`:
```tsx
import { Screen } from './Screen';
import { Text } from './Text';

export function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <Screen className="justify-center items-center gap-2">
      <Text variant="display">{title}</Text>
      <Text variant="muted">Coming in {phase}.</Text>
    </Screen>
  );
}
```
Add `export { Placeholder } from './Placeholder';` to `apps/mobile/src/ui/index.ts`.

- [ ] **Step 5: Root layout (static for now — Task 5 adds the auth gates)**

`apps/mobile/app/_layout.tsx`:
```tsx
import '../global.css';

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="account-setup" />
          <Stack.Screen name="profile" options={{ presentation: 'modal', headerShown: true, title: 'Profile' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 6: Auth stack screens (static)**

`apps/mobile/app/(auth)/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`apps/mobile/app/(auth)/welcome.tsx`:
```tsx
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button, Screen, Text } from '@/ui';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <Screen className="justify-between">
      <View className="flex-1 items-center justify-center gap-3">
        <Text variant="display" className="text-4xl text-primary">Prayer Warriors</Text>
        <Text variant="muted" className="text-center text-base">
          A private prayer circle for our fellowship.
        </Text>
      </View>
      <View className="gap-3">
        <Button title="Sign in" onPress={() => router.push('/(auth)/login')} />
        <Text variant="muted" className="text-center">
          Membership is by invitation. Ask your group admin for access.
        </Text>
      </View>
    </Screen>
  );
}
```

`apps/mobile/app/(auth)/login.tsx` (static; Task 5 wires `useAuth`):
```tsx
import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/ui';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <Screen scroll className="justify-center gap-6">
      <View className="gap-1">
        <Text variant="display" className="text-primary">Welcome back</Text>
        <Text variant="muted">Sign in with the email your admin invited.</Text>
      </View>
      <View className="gap-4">
        <Input
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Password"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />
        <Button title="Sign in" onPress={() => {}} />
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable accessibilityRole="link" className="self-center py-2">
            <Text variant="label" className="text-primary">Forgot password?</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}
```
(Import `Pressable` from `react-native` alongside `View`. `Link` itself is not wrapped by NativeWind, so the className goes on a core `Pressable` via `asChild`.)

`apps/mobile/app/(auth)/forgot-password.tsx` (static):
```tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/ui';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  return (
    <Screen scroll className="justify-center gap-6">
      <View className="gap-1">
        <Text variant="display" className="text-primary">Reset password</Text>
        <Text variant="muted">We will email you a link to choose a new password.</Text>
      </View>
      <View className="gap-4">
        <Input
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Button title="Send reset link" onPress={() => {}} />
        <Button title="Back to sign in" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 7: Tabs, profile, account-setup (static)**

`apps/mobile/app/(tabs)/_layout.tsx`:
```tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline' },
  { name: 'prayer', title: 'Prayer', icon: 'heart-outline' },
  { name: 'community', title: 'Community', icon: 'people-outline' },
  { name: 'resources', title: 'Resources', icon: 'book-outline' },
  { name: 'funds', title: 'Funds', icon: 'wallet-outline' },
];

export default function TabsLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 22, color: colors.primary },
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => router.push('/profile')}
            hitSlop={8}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
          </Pressable>
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 11 },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
```

`apps/mobile/app/(tabs)/index.tsx`:
```tsx
import { Placeholder } from '@/ui';

export default function HomeScreen() {
  return <Placeholder title="Home" phase="Phase 2" />;
}
```
Create `prayer.tsx`, `community.tsx`, `resources.tsx`, `funds.tsx` the same way with titles `Prayer` (Phase 3), `Community` (Phase 2), `Resources` (Phase 4), `Funds` (Phase 6). Component names: `PrayerScreen`, `CommunityScreen`, `ResourcesScreen`, `FundsScreen`.

`apps/mobile/app/profile.tsx` (static):
```tsx
import { View } from 'react-native';

import { Button, Card, Screen, Text } from '@/ui';

export default function ProfileScreen() {
  return (
    <Screen className="gap-4">
      <Card className="gap-1">
        <Text variant="title">Member</Text>
        <Text variant="muted">member@example.com</Text>
      </Card>
      <View className="mt-auto">
        <Button title="Sign out" variant="secondary" onPress={() => {}} />
      </View>
    </Screen>
  );
}
```

`apps/mobile/app/account-setup.tsx` (static):
```tsx
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/ui';

export default function AccountSetupScreen() {
  const [displayName, setDisplayName] = useState('');
  return (
    <Screen scroll className="justify-center gap-6">
      <View className="gap-1">
        <Text variant="display" className="text-primary">Welcome</Text>
        <Text variant="muted">How should the group know you?</Text>
      </View>
      <View className="gap-4">
        <Input label="Display name" value={displayName} onChangeText={setDisplayName} maxLength={40} />
        <Button title="Continue" onPress={() => {}} disabled={displayName.trim().length === 0} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 8: Verify it boots**

```bash
npm run typecheck -w apps/mobile && npm test -w apps/mobile
cd apps/mobile && EXPO_PUBLIC_PARSE_APP_ID=x EXPO_PUBLIC_PARSE_JS_KEY=y npx expo export --platform web --output-dir /tmp/pw-web && cd ../..
```
Expected: tsc clean, 5 tests pass (prototype tests are gone), web export succeeds. Then start `npm run mobile` with `w`, open the URL, and confirm the Welcome screen renders with Playfair heading; navigate `/(tabs)` manually via URL `http://localhost:8081/` → since there is no gate yet, `/` resolves to `(tabs)/index`; check the five tabs render and the avatar opens Profile.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(mobile): add Expo Router auth stack and five-tab skeleton; remove prototype"
```

---

### Task 4: Parse SDK init and typed AuthService (TDD)

**Files:**
- Create: `apps/mobile/src/config.ts` (replace existing), `apps/mobile/src/lib/parse.ts`, `apps/mobile/src/features/auth/types.ts`, `errors.ts`, `service.ts`
- Test: `apps/mobile/src/features/auth/errors.test.ts`, `apps/mobile/src/features/auth/service.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type AuthUser = { id: string; email: string; displayName: string | null; phone: string | null };
  type AuthService = {
    getCurrentUser(): Promise<AuthUser | null>;
    signIn(email: string, password: string): Promise<AuthUser>;
    signOut(): Promise<void>;
    requestPasswordReset(email: string): Promise<void>;
    updateProfile(patch: { displayName?: string; phone?: string }): Promise<AuthUser>;
  };
  function createParseAuthService(parse: ParseLike): AuthService;
  function mapParseError(err: unknown): Error;   // friendly message
  const parseAuthService: AuthService;           // from src/lib/parse.ts
  ```

- [ ] **Step 1: Install Parse (inside `apps/mobile`)**

```bash
cd apps/mobile
npx expo install @react-native-async-storage/async-storage react-native-get-random-values
npm install parse@8.6.0
cd ../..
```

- [ ] **Step 2: Config reader**

Replace `apps/mobile/src/config.ts` with:
```ts
export type ParseConfig = { serverUrl: string; appId: string; jsKey: string };

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name}. Copy apps/mobile/.env.example to .env and fill in your Back4App keys.`);
  }
  return value;
}

export function loadParseConfig(): ParseConfig {
  return {
    serverUrl: process.env.EXPO_PUBLIC_PARSE_SERVER_URL ?? 'https://parseapi.back4app.com',
    appId: required('EXPO_PUBLIC_PARSE_APP_ID', process.env.EXPO_PUBLIC_PARSE_APP_ID),
    jsKey: required('EXPO_PUBLIC_PARSE_JS_KEY', process.env.EXPO_PUBLIC_PARSE_JS_KEY),
  };
}
```

- [ ] **Step 3: Types**

`apps/mobile/src/features/auth/types.ts`:
```ts
export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  phone: string | null;
};

export type ProfilePatch = { displayName?: string; phone?: string };

export type AuthService = {
  getCurrentUser(): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updateProfile(patch: ProfilePatch): Promise<AuthUser>;
};

/** The slice of the Parse SDK the auth service touches. Lets tests inject fakes. */
export type ParseUserLike = {
  id: string;
  getEmail(): string | undefined;
  get(key: string): unknown;
  set(key: string, value: unknown): unknown;
  save(): Promise<unknown>;
};

export type ParseLike = {
  User: {
    currentAsync(): Promise<ParseUserLike | null>;
    logIn(username: string, password: string): Promise<ParseUserLike>;
    logOut(): Promise<unknown>;
    requestPasswordReset(email: string): Promise<unknown>;
  };
};
```

- [ ] **Step 4: Failing error-mapping test**

`apps/mobile/src/features/auth/errors.test.ts`:
```ts
import { mapParseError } from './errors';

function parseError(code: number, message = 'raw') {
  return Object.assign(new Error(message), { code });
}

describe('mapParseError', () => {
  it.each([
    [101, 'Incorrect email or password.'],
    [205, 'No account uses that email.'],
    [100, 'Could not reach the server. Check your connection and try again.'],
    [209, 'Your session has expired. Please sign in again.'],
  ])('maps Parse code %i to a friendly message', (code, expected) => {
    expect(mapParseError(parseError(code)).message).toBe(expected);
  });

  it('keeps the original message for unknown codes', () => {
    expect(mapParseError(parseError(999, 'weird')).message).toBe('weird');
  });

  it('wraps non-Error values', () => {
    expect(mapParseError('boom').message).toBe('Something went wrong. Please try again.');
  });
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npm test -w apps/mobile -- errors`
Expected: FAIL, cannot find module './errors'.

- [ ] **Step 6: Implement errors.ts**

```ts
const messages: Record<number, string> = {
  100: 'Could not reach the server. Check your connection and try again.',
  101: 'Incorrect email or password.',
  200: 'Please enter your email.',
  201: 'Please enter your password.',
  205: 'No account uses that email.',
  209: 'Your session has expired. Please sign in again.',
};

export function mapParseError(err: unknown): Error {
  if (err instanceof Error) {
    const code = (err as { code?: unknown }).code;
    if (typeof code === 'number' && messages[code]) return new Error(messages[code]);
    return err;
  }
  return new Error('Something went wrong. Please try again.');
}
```

- [ ] **Step 7: Run errors test — expect PASS**

Run: `npm test -w apps/mobile -- errors`

- [ ] **Step 8: Failing service test**

`apps/mobile/src/features/auth/service.test.ts`:
```ts
import { createParseAuthService } from './service';
import type { ParseLike, ParseUserLike } from './types';

type Fields = { email: string; displayName?: string; phone?: string };

function fakeUser(id: string, fields: Fields): ParseUserLike & { fields: Fields; saved: number } {
  const user = {
    id,
    fields,
    saved: 0,
    getEmail: () => fields.email,
    get: (key: string) => (fields as Record<string, unknown>)[key],
    set: (key: string, value: unknown) => {
      (fields as Record<string, unknown>)[key] = value;
    },
    save: async () => {
      user.saved += 1;
      return user;
    },
  };
  return user;
}

function fakeParse(current: ParseUserLike | null) {
  const User = {
    currentAsync: jest.fn(async () => current),
    logIn: jest.fn(async () => current as ParseUserLike),
    logOut: jest.fn(async () => undefined),
    requestPasswordReset: jest.fn(async () => undefined),
  };
  return { parse: { User } as ParseLike, User };
}

describe('createParseAuthService', () => {
  it('returns null when nobody is signed in', async () => {
    const { parse } = fakeParse(null);
    await expect(createParseAuthService(parse).getCurrentUser()).resolves.toBeNull();
  });

  it('maps the current Parse user to AuthUser', async () => {
    const { parse } = fakeParse(fakeUser('u1', { email: 'a@b.c', displayName: 'Ana' }));
    await expect(createParseAuthService(parse).getCurrentUser()).resolves.toEqual({
      id: 'u1',
      email: 'a@b.c',
      displayName: 'Ana',
      phone: null,
    });
  });

  it('signs in with a trimmed, lower-cased email', async () => {
    const { parse, User } = fakeParse(fakeUser('u1', { email: 'a@b.c' }));
    const user = await createParseAuthService(parse).signIn('  A@B.C ', 'pw');
    expect(User.logIn).toHaveBeenCalledWith('a@b.c', 'pw');
    expect(user.displayName).toBeNull();
  });

  it('translates Parse errors on sign-in', async () => {
    const { parse, User } = fakeParse(null);
    User.logIn.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 101 }));
    await expect(createParseAuthService(parse).signIn('a@b.c', 'bad')).rejects.toThrow(
      'Incorrect email or password.',
    );
  });

  it('signs out', async () => {
    const { parse, User } = fakeParse(null);
    await createParseAuthService(parse).signOut();
    expect(User.logOut).toHaveBeenCalled();
  });

  it('requests a password reset', async () => {
    const { parse, User } = fakeParse(null);
    await createParseAuthService(parse).requestPasswordReset(' A@B.C ');
    expect(User.requestPasswordReset).toHaveBeenCalledWith('a@b.c');
  });

  it('updates and saves the profile', async () => {
    const current = fakeUser('u1', { email: 'a@b.c' });
    const { parse } = fakeParse(current);
    const updated = await createParseAuthService(parse).updateProfile({ displayName: '  Ana ' });
    expect(current.saved).toBe(1);
    expect(updated.displayName).toBe('Ana');
  });

  it('refuses to update the profile when signed out', async () => {
    const { parse } = fakeParse(null);
    await expect(
      createParseAuthService(parse).updateProfile({ displayName: 'Ana' }),
    ).rejects.toThrow('Your session has expired. Please sign in again.');
  });
});
```

- [ ] **Step 9: Run it to verify it fails**

Run: `npm test -w apps/mobile -- service`
Expected: FAIL, cannot find module './service'.

- [ ] **Step 10: Implement service.ts**

```ts
import { mapParseError } from './errors';
import type { AuthService, AuthUser, ParseLike, ParseUserLike, ProfilePatch } from './types';

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toAuthUser(user: ParseUserLike): AuthUser {
  return {
    id: user.id,
    email: user.getEmail() ?? '',
    displayName: optionalString(user.get('displayName')),
    phone: optionalString(user.get('phone')),
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw mapParseError(err);
  }
}

export function createParseAuthService(parse: ParseLike): AuthService {
  return {
    getCurrentUser: () =>
      guarded(async () => {
        const user = await parse.User.currentAsync();
        return user ? toAuthUser(user) : null;
      }),

    signIn: (email, password) =>
      guarded(async () => toAuthUser(await parse.User.logIn(normalizeEmail(email), password))),

    signOut: () =>
      guarded(async () => {
        await parse.User.logOut();
      }),

    requestPasswordReset: (email) =>
      guarded(async () => {
        await parse.User.requestPasswordReset(normalizeEmail(email));
      }),

    updateProfile: (patch: ProfilePatch) =>
      guarded(async () => {
        const user = await parse.User.currentAsync();
        if (!user) throw Object.assign(new Error('signed out'), { code: 209 });
        if (patch.displayName !== undefined) user.set('displayName', patch.displayName.trim());
        if (patch.phone !== undefined) user.set('phone', patch.phone.trim());
        await user.save();
        return toAuthUser(user);
      }),
  };
}
```

- [ ] **Step 11: Run service tests — expect 8 PASS**

Run: `npm test -w apps/mobile -- service`

- [ ] **Step 12: Real Parse wiring**

`apps/mobile/src/lib/parse.ts`:
```ts
import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Parse from 'parse/react-native.js';

import { loadParseConfig } from '../config';
import { createParseAuthService } from '../features/auth/service';

const config = loadParseConfig();

Parse.setAsyncStorage(AsyncStorage);
Parse.initialize(config.appId, config.jsKey);
Parse.serverURL = config.serverUrl;

export { Parse };
export const parseAuthService = createParseAuthService({ User: Parse.User });
```
If `tsc` rejects `{ User: Parse.User }` against `ParseLike` (static method signatures differ slightly between SDK versions), wrap explicitly instead of casting:
```ts
export const parseAuthService = createParseAuthService({
  User: {
    currentAsync: () => Parse.User.currentAsync(),
    logIn: (u, p) => Parse.User.logIn(u, p),
    logOut: () => Parse.User.logOut(),
    requestPasswordReset: (e) => Parse.User.requestPasswordReset(e),
  },
});
```

- [ ] **Step 13: Typecheck and full tests, then commit**

```bash
npm run typecheck && npm test
git add -A
git commit -m "feat(auth): add Parse SDK init and typed AuthService with error mapping"
```

---

### Task 5: AuthProvider, gates, and wired screens

**Files:**
- Create: `apps/mobile/src/features/auth/gate.ts`, `AuthProvider.tsx`, `index.ts`
- Test: `apps/mobile/src/features/auth/gate.test.ts`, `apps/mobile/src/features/auth/AuthProvider.test.tsx`
- Modify: `apps/mobile/app/_layout.tsx`, `(auth)/login.tsx`, `(auth)/forgot-password.tsx`, `account-setup.tsx`, `profile.tsx`, `(tabs)/index.tsx`

**Interfaces:**
- Consumes: `AuthService`, `AuthUser`, `parseAuthService`.
- Produces:
  ```ts
  type AuthStatus = 'loading' | 'signedOut' | 'signedIn';
  type Gate = 'loading' | 'auth' | 'setup' | 'app';
  function resolveGate(status: AuthStatus, user: AuthUser | null): Gate;
  <AuthProvider service={AuthService}>…</AuthProvider>
  useAuth(): { status, user, signIn, signOut, requestPasswordReset, updateProfile }
  ```

- [ ] **Step 1: Failing gate test**

`apps/mobile/src/features/auth/gate.test.ts`:
```ts
import { resolveGate } from './gate';

const user = { id: 'u1', email: 'a@b.c', displayName: 'Ana', phone: null };

describe('resolveGate', () => {
  it('is loading while the session is being restored', () => {
    expect(resolveGate('loading', null)).toBe('loading');
  });
  it('sends signed-out users to auth', () => {
    expect(resolveGate('signedOut', null)).toBe('auth');
  });
  it('sends signed-in users without a display name to setup', () => {
    expect(resolveGate('signedIn', { ...user, displayName: null })).toBe('setup');
  });
  it('sends complete users into the app', () => {
    expect(resolveGate('signedIn', user)).toBe('app');
  });
});
```

- [ ] **Step 2: Run — expect FAIL (module missing)**

Run: `npm test -w apps/mobile -- gate`

- [ ] **Step 3: Implement gate.ts**

```ts
import type { AuthUser } from './types';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';
export type Gate = 'loading' | 'auth' | 'setup' | 'app';

export function resolveGate(status: AuthStatus, user: AuthUser | null): Gate {
  if (status === 'loading') return 'loading';
  if (status === 'signedOut' || !user) return 'auth';
  return user.displayName ? 'app' : 'setup';
}
```

- [ ] **Step 4: Run — expect 4 PASS**

- [ ] **Step 5: Failing AuthProvider test**

`apps/mobile/src/features/auth/AuthProvider.test.tsx`:
```tsx
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { AuthProvider, useAuth } from './AuthProvider';
import type { AuthService, AuthUser } from './types';

const ana: AuthUser = { id: 'u1', email: 'a@b.c', displayName: 'Ana', phone: null };

function fakeService(current: AuthUser | null): jest.Mocked<AuthService> {
  return {
    getCurrentUser: jest.fn(async () => current),
    signIn: jest.fn(async () => ana),
    signOut: jest.fn(async () => undefined),
    requestPasswordReset: jest.fn(async () => undefined),
    updateProfile: jest.fn(async (patch) => ({ ...ana, ...patch, displayName: patch.displayName ?? ana.displayName })),
  };
}

function wrapperFor(service: AuthService) {
  return ({ children }: PropsWithChildren) => <AuthProvider service={service}>{children}</AuthProvider>;
}

describe('AuthProvider', () => {
  it('restores the session on mount', async () => {
    const service = fakeService(ana);
    const { result } = renderHook(() => useAuth(), { wrapper: wrapperFor(service) });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('signedIn'));
    expect(result.current.user).toEqual(ana);
  });

  it('is signedOut when there is no session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapperFor(fakeService(null)) });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
  });

  it('signs in and out', async () => {
    const service = fakeService(null);
    const { result } = renderHook(() => useAuth(), { wrapper: wrapperFor(service) });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    await act(() => result.current.signIn('a@b.c', 'pw'));
    expect(result.current.status).toBe('signedIn');
    await act(() => result.current.signOut());
    expect(result.current.status).toBe('signedOut');
    expect(result.current.user).toBeNull();
  });

  it('updates the user after a profile change', async () => {
    const service = fakeService({ ...ana, displayName: null });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapperFor(service) });
    await waitFor(() => expect(result.current.status).toBe('signedIn'));
    await act(() => result.current.updateProfile({ displayName: 'Ana' }));
    expect(result.current.user?.displayName).toBe('Ana');
  });

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used inside <AuthProvider>');
  });
});
```

- [ ] **Step 6: Run — expect FAIL (module missing)**

Run: `npm test -w apps/mobile -- AuthProvider`

- [ ] **Step 7: Implement AuthProvider.tsx and index.ts**

`apps/mobile/src/features/auth/AuthProvider.tsx`:
```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { AuthStatus } from './gate';
import type { AuthService, AuthUser, ProfilePatch } from './types';

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updateProfile(patch: ProfilePatch): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ service, children }: PropsWithChildren<{ service: AuthService }>) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    service
      .getCurrentUser()
      .then((current) => {
        if (cancelled) return;
        setUser(current);
        setStatus(current ? 'signedIn' : 'signedOut');
      })
      .catch(() => {
        if (!cancelled) setStatus('signedOut');
      });
    return () => {
      cancelled = true;
    };
  }, [service]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const signedIn = await service.signIn(email, password);
      setUser(signedIn);
      setStatus('signedIn');
    },
    [service],
  );

  const signOut = useCallback(async () => {
    await service.signOut();
    setUser(null);
    setStatus('signedOut');
  }, [service]);

  const requestPasswordReset = useCallback(
    (email: string) => service.requestPasswordReset(email),
    [service],
  );

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      setUser(await service.updateProfile(patch));
    },
    [service],
  );

  const value = useMemo(
    () => ({ status, user, signIn, signOut, requestPasswordReset, updateProfile }),
    [status, user, signIn, signOut, requestPasswordReset, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
```

`apps/mobile/src/features/auth/index.ts`:
```ts
export { AuthProvider, useAuth } from './AuthProvider';
export { resolveGate } from './gate';
export type { AuthStatus, Gate } from './gate';
export type { AuthService, AuthUser, ProfilePatch } from './types';
```

- [ ] **Step 8: Run — expect 5 PASS**

Run: `npm test -w apps/mobile -- AuthProvider`

- [ ] **Step 9: Gate the root layout**

Replace the `Stack` block in `apps/mobile/app/_layout.tsx` so the file becomes:
```tsx
import '../global.css';

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, resolveGate, useAuth } from '@/features/auth';
import { parseAuthService } from '@/lib/parse';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

function GatedStack({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { status, user } = useAuth();
  const gate = resolveGate(status, user);
  const ready = fontsLoaded && gate !== 'loading';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Protected guard={gate === 'auth'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={gate === 'setup'}>
        <Stack.Screen name="account-setup" />
      </Stack.Protected>
      <Stack.Protected guard={gate === 'app'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="profile"
          options={{ presentation: 'modal', headerShown: true, title: 'Profile' }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider service={parseAuthService}>
          <GatedStack fontsLoaded={fontsLoaded} />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```
Also add `apps/mobile/app/(auth)/index.tsx` so the group has a default route:
```tsx
import { Redirect } from 'expo-router';

export default function AuthIndex() {
  return <Redirect href="/(auth)/welcome" />;
}
```

- [ ] **Step 10: Wire login, forgot-password, account-setup, profile, home**

`login.tsx` — replace the component body:
```tsx
import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { Button, Input, Screen, Text } from '@/ui';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <Screen scroll className="justify-center gap-6">
      <View className="gap-1">
        <Text variant="display" className="text-primary">Welcome back</Text>
        <Text variant="muted">Sign in with the email your admin invited.</Text>
      </View>
      <View className="gap-4">
        <Input
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Password"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
          error={error}
        />
        <Button
          title="Sign in"
          onPress={submit}
          loading={busy}
          disabled={!email.trim() || !password}
        />
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable accessibilityRole="link" className="self-center py-2">
            <Text variant="label" className="text-primary">Forgot password?</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}
```
(Import line: `import { Pressable, View } from 'react-native';`.)

`forgot-password.tsx` — replace the component body:
```tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { Button, Input, Screen, Text } from '@/ui';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset email.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll className="justify-center gap-6">
      <View className="gap-1">
        <Text variant="display" className="text-primary">Reset password</Text>
        <Text variant="muted">We will email you a link to choose a new password.</Text>
      </View>
      {sent ? (
        <Text>Check your inbox for the reset link.</Text>
      ) : (
        <View className="gap-4">
          <Input
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={error}
          />
          <Button title="Send reset link" onPress={submit} loading={busy} disabled={!email.trim()} />
        </View>
      )}
      <Button title="Back to sign in" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
```

`account-setup.tsx` — replace the component body:
```tsx
import { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { Button, Input, Screen, Text } from '@/ui';

export default function AccountSetupScreen() {
  const { updateProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await updateProfile({ displayName });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your name.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll className="justify-center gap-6">
      <View className="gap-1">
        <Text variant="display" className="text-primary">Welcome</Text>
        <Text variant="muted">How should the group know you?</Text>
      </View>
      <View className="gap-4">
        <Input
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={40}
          error={error}
        />
        <Button
          title="Continue"
          onPress={submit}
          loading={busy}
          disabled={displayName.trim().length === 0}
        />
        <Button title="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </Screen>
  );
}
```

`profile.tsx` — replace the component body:
```tsx
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { Button, Card, Screen, Text } from '@/ui';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  return (
    <Screen className="gap-4">
      <Card className="gap-1">
        <Text variant="title">{user?.displayName ?? 'Member'}</Text>
        <Text variant="muted">{user?.email}</Text>
      </Card>
      <View className="mt-auto">
        <Button title="Sign out" variant="secondary" onPress={signOut} />
      </View>
    </Screen>
  );
}
```

`(tabs)/index.tsx` — a calm greeting instead of the placeholder:
```tsx
import { useAuth } from '@/features/auth';
import { Card, Screen, Text } from '@/ui';

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user } = useAuth();
  return (
    <Screen scroll className="gap-4">
      <Text variant="display" className="text-primary">
        {greeting(new Date())}, {user?.displayName ?? 'friend'}
      </Text>
      <Card className="gap-1">
        <Text variant="label" className="text-gold">Today's Scripture</Text>
        <Text className="font-display text-lg">
          "The prayer of a righteous person is powerful and effective."
        </Text>
        <Text variant="muted">James 5:16</Text>
      </Card>
      <Text variant="muted">Prayer requests, calls, and resources arrive in the next phases.</Text>
    </Screen>
  );
}
```

- [ ] **Step 11: Typecheck, test, export**

```bash
npm run typecheck && npm test
cd apps/mobile && EXPO_PUBLIC_PARSE_APP_ID=x EXPO_PUBLIC_PARSE_JS_KEY=y npx expo export --platform web --output-dir /tmp/pw-web && cd ../..
```
Expected: tsc clean; 5 + 3 + 8 + 4 + 5 = 25 tests pass; export succeeds. Manual check comes in Task 7 once the backend exists.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(auth): add AuthProvider, protected route gates, and wired auth screens"
```

---

### Task 6: Back4App schema, roles, and first group script

**Files:**
- Create: `backend/schema/setup.mjs`, `backend/cloud/main.js`, `backend/README.md`, `backend/.env.example`
- Delete: `scripts/setup-schema.mjs` (prototype)
- Modify: root `.gitignore` (add `backend/.env`), root `README.md`

**Interfaces:**
- Consumes: env `PARSE_APP_ID`, `PARSE_MASTER_KEY`, optional `PARSE_SERVER_URL`, `GROUP_NAME` (default "Prayer Warriors"), optional `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`.
- Produces: `_User` fields, `Group`, `GroupMember` classes, roles `group:<groupId>:member` and `group:<groupId>:admin`, one Group, optionally one admin user + GroupMember row. Idempotent: safe to re-run.

- [ ] **Step 1: Remove the prototype script**

```bash
git rm -q scripts/setup-schema.mjs && rmdir scripts 2>/dev/null; echo 'backend/.env' >> .gitignore
```

- [ ] **Step 2: Write setup.mjs**

`backend/schema/setup.mjs`:
```js
#!/usr/bin/env node
// Idempotent Back4App setup for Prayer Warriors Phase 1.
// Usage: PARSE_APP_ID=... PARSE_MASTER_KEY=... node backend/schema/setup.mjs
// Optional: PARSE_SERVER_URL, GROUP_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME

const serverUrl = process.env.PARSE_SERVER_URL ?? 'https://parseapi.back4app.com';
const appId = process.env.PARSE_APP_ID;
const masterKey = process.env.PARSE_MASTER_KEY;
const groupName = process.env.GROUP_NAME ?? 'Prayer Warriors';

if (!appId || !masterKey) {
  console.error('Set PARSE_APP_ID and PARSE_MASTER_KEY.');
  process.exit(1);
}

const headers = {
  'X-Parse-Application-Id': appId,
  'X-Parse-Master-Key': masterKey,
  'Content-Type': 'application/json',
};

async function api(method, path, body) {
  const res = await fetch(`${serverUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function upsertSchema(schema) {
  const path = `/schemas/${schema.className}`;
  let res = await api('POST', path, schema);
  if (!res.ok && res.status === 400) res = await api('PUT', path, schema);
  if (!res.ok) throw new Error(`${schema.className}: ${JSON.stringify(res.data)}`);
  console.log(`✓ schema ${schema.className}`);
}

const authenticated = { requiresAuthentication: true };
const masterOnly = {};

const userSchema = {
  className: '_User',
  fields: {
    displayName: { type: 'String' },
    phone: { type: 'String' },
    avatar: { type: 'File' },
  },
  classLevelPermissions: {
    find: authenticated,
    get: authenticated,
    count: authenticated,
    create: masterOnly, // no public signup
    update: authenticated, // ACL restricts to the row owner
    delete: masterOnly,
    addField: masterOnly,
    protectedFields: { '*': ['email', 'phone', 'authData', 'emailVerified'] },
  },
};

const groupSchema = {
  className: 'Group',
  fields: {
    name: { type: 'String', required: true },
    description: { type: 'String' },
    createdBy: { type: 'Pointer', targetClass: '_User' },
  },
  classLevelPermissions: {
    find: authenticated,
    get: authenticated,
    count: authenticated,
    create: masterOnly,
    update: masterOnly,
    delete: masterOnly,
    addField: masterOnly,
    protectedFields: {},
  },
};

const groupMemberSchema = {
  className: 'GroupMember',
  fields: {
    group: { type: 'Pointer', targetClass: 'Group', required: true },
    user: { type: 'Pointer', targetClass: '_User', required: true },
    role: { type: 'String', required: true }, // 'admin' | 'member'
    status: { type: 'String', required: true, defaultValue: 'active' }, // 'active' | 'inactive'
    joinedAt: { type: 'Date' },
  },
  classLevelPermissions: {
    find: authenticated,
    get: authenticated,
    count: authenticated,
    create: masterOnly,
    update: masterOnly,
    delete: masterOnly,
    addField: masterOnly,
    protectedFields: {},
  },
};

async function findOne(className, where) {
  const res = await api('GET', `/classes/${className}?limit=1&where=${encodeURIComponent(JSON.stringify(where))}`);
  if (!res.ok) throw new Error(`query ${className}: ${JSON.stringify(res.data)}`);
  return res.data.results[0] ?? null;
}

async function ensureRole(name, acl) {
  const existing = await findOne('_Role', { name });
  if (existing) return existing.objectId;
  const res = await api('POST', '/roles', { name, ACL: acl });
  if (!res.ok) throw new Error(`role ${name}: ${JSON.stringify(res.data)}`);
  console.log(`✓ role ${name}`);
  return res.data.objectId;
}

async function ensureGroup() {
  const existing = await findOne('Group', { name: groupName });
  if (existing) return existing.objectId;
  const res = await api('POST', '/classes/Group', { name: groupName });
  if (!res.ok) throw new Error(`group: ${JSON.stringify(res.data)}`);
  console.log(`✓ group "${groupName}"`);
  return res.data.objectId;
}

async function ensureAdmin(groupId, memberRole, adminRole) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('· skipping admin user (ADMIN_EMAIL/ADMIN_PASSWORD not set)');
    return;
  }
  const username = email.trim().toLowerCase();
  let user = await findOne('_User', { username });
  if (!user) {
    const res = await api('POST', '/users', {
      username,
      email: username,
      password,
      displayName: process.env.ADMIN_NAME ?? '',
    });
    if (!res.ok) throw new Error(`admin user: ${JSON.stringify(res.data)}`);
    user = res.data;
    console.log(`✓ admin user ${username}`);
  }
  const userPointer = { __type: 'Pointer', className: '_User', objectId: user.objectId };
  const addUsers = { users: { __op: 'AddRelation', objects: [userPointer] } };
  await api('PUT', `/roles/${adminRole}`, addUsers);
  await api('PUT', `/roles/${memberRole}`, addUsers);

  const membership = await findOne('GroupMember', { user: userPointer, group: { __type: 'Pointer', className: 'Group', objectId: groupId } });
  if (!membership) {
    const res = await api('POST', '/classes/GroupMember', {
      group: { __type: 'Pointer', className: 'Group', objectId: groupId },
      user: userPointer,
      role: 'admin',
      status: 'active',
      joinedAt: { __type: 'Date', iso: new Date().toISOString() },
      ACL: { [`role:group:${groupId}:member`]: { read: true }, [`role:group:${groupId}:admin`]: { read: true } },
    });
    if (!res.ok) throw new Error(`membership: ${JSON.stringify(res.data)}`);
    console.log('✓ admin membership');
  }
}

await upsertSchema(userSchema);
await upsertSchema(groupSchema);
await upsertSchema(groupMemberSchema);

const groupId = await ensureGroup();
const memberRoleName = `group:${groupId}:member`;
const adminRoleName = `group:${groupId}:admin`;
const roleAcl = { '*': { read: true } };
const memberRole = await ensureRole(memberRoleName, roleAcl);
const adminRole = await ensureRole(adminRoleName, roleAcl);

// Admins inherit member permissions: member role contains the admin role as a child.
await api('PUT', `/roles/${memberRole}`, {
  roles: { __op: 'AddRelation', objects: [{ __type: 'Pointer', className: '_Role', objectId: adminRole }] },
});

// Group is readable by members, writable by nobody but master (admin writes arrive with Cloud Code in Phase 2).
await api('PUT', `/classes/Group/${groupId}`, {
  ACL: { [`role:${memberRoleName}`]: { read: true }, [`role:${adminRoleName}`]: { read: true } },
});

await ensureAdmin(groupId, memberRole, adminRole);

console.log(`\nDone. groupId=${groupId}`);
```

- [ ] **Step 3: Cloud Code placeholder and docs**

`backend/cloud/main.js`:
```js
// Prayer Warriors Cloud Code. Phase 1 has no cloud functions; Phase 2 adds member invites.
Parse.Cloud.define('ping', () => 'pong');
```

`backend/.env.example`:
```
PARSE_SERVER_URL=https://parseapi.back4app.com
PARSE_APP_ID=
PARSE_MASTER_KEY=
GROUP_NAME=Prayer Warriors
# Optional: create the first admin on first run
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_NAME=
```

`backend/README.md`:
```markdown
# Backend (Back4App / Parse Server)

Prayer Warriors uses a dedicated Back4App app named **PrayerWarriors**. Never point
this at an app that hosts another product: `_User`, `_Role`, and `_Session` are shared
across the whole Parse app.

## First-time setup

    cp backend/.env.example backend/.env   # fill in keys from App Settings → Security & Keys
    set -a; source backend/.env; set +a
    node backend/schema/setup.mjs

The script is idempotent. It creates/updates `_User` fields, `Group`, `GroupMember`,
the first group, its `group:<id>:member` / `group:<id>:admin` roles, and (if
`ADMIN_EMAIL`/`ADMIN_PASSWORD` are set) the first admin user.

## Access model

- Sign-up is master-key only (admins create members). Username = email.
- Every class requires authentication to read; writes are master-key only in Phase 1.
- Per-group Parse Roles are the equivalent of row-level security. Objects carry ACLs
  granting read to `role:group:<id>:member`.

## Cloud Code

`backend/cloud/main.js` is deployed with the Back4App CLI or dashboard.
```

Update the root `README.md`: replace the Back4App setup steps 1–3 with a pointer to `backend/README.md`, and note the mobile env file lives at `apps/mobile/.env`.

- [ ] **Step 4: Run against the PrayerWarriors app**

Requires the app's keys in `backend/.env` (ask the owner if absent).
```bash
set -a; source backend/.env; set +a
node backend/schema/setup.mjs
node backend/schema/setup.mjs   # second run must print the same ✓ lines without errors
```
Expected: `✓ schema _User`, `✓ schema Group`, `✓ schema GroupMember`, `✓ group`, two `✓ role`, optional admin lines, `Done. groupId=…`.

- [ ] **Step 5: Remove the prototype class from PastorDairy**

```bash
curl -s -X DELETE https://parseapi.back4app.com/schemas/PrayerRequest \
  -H "X-Parse-Application-Id: $PASTORDAIRY_APP_ID" \
  -H "X-Parse-Master-Key: $PASTORDAIRY_MASTER_KEY"
```
Expected: `{}`. (The class is empty; the only test record was deleted on 2026-09-07.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(backend): add idempotent Back4App schema, roles, and first-group setup"
```

---

### Task 7: End-to-end verification and Phase 1 wrap-up

**Files:**
- Modify: `apps/mobile/.env` (PrayerWarriors keys), `apps/mobile/.env.example`, root `README.md`

- [ ] **Step 1: Point the app at PrayerWarriors**

`apps/mobile/.env`:
```
EXPO_PUBLIC_PARSE_SERVER_URL=https://parseapi.back4app.com
EXPO_PUBLIC_PARSE_APP_ID=<PrayerWarriors application id>
EXPO_PUBLIC_PARSE_JS_KEY=<PrayerWarriors javascript key>
```

- [ ] **Step 2: Manual flow on web**

```bash
npm run mobile   # press w
```
Check, in order:
1. Welcome renders (Playfair heading, "Sign in" button). No signup entry point.
2. Login with a wrong password shows "Incorrect email or password." under the password field.
3. Login with the admin created by `setup.mjs` (without `ADMIN_NAME`) lands on Account Setup.
4. Entering a display name lands on Home with "Good …, <name>".
5. All five tabs render; avatar opens the Profile modal; Sign out returns to Welcome.
6. Reload the page while signed in: the session is restored straight into the tabs.
7. Forgot password with the admin email shows "Check your inbox".

- [ ] **Step 3: Run the full suite and CI checks locally**

```bash
npm run typecheck && npm test
```
Expected: all green.

- [ ] **Step 4: Update README and commit**

Root `README.md` "Project layout" becomes the tree from this plan's "File structure" section; scripts table becomes `npm run mobile`, `npm test`, `npm run typecheck`.

```bash
git add -A
git commit -m "docs: Phase 1 foundation complete"
```

---

## Self-review

- **Spec coverage:** repo layout (T1), CI (T1), design system + fonts (T2), routing + gates (T3/T5), auth service + errors (T4), provider + screens (T5), schema/CLPs/roles/first group/admin (T6), PastorDairy cleanup (T6), env (T4/T7). Avatar upload and invites are explicitly out of scope.
- **Placeholders:** none; every code step has full content. Two "if X fails, do Y" notes give the exact alternative.
- **Type consistency:** `AuthUser`, `AuthService`, `ParseLike`, `ProfilePatch` defined in T4 and used verbatim in T5; `AuthStatus`/`Gate` defined in T5 `gate.ts` and imported by `AuthProvider.tsx`; `tokens.colors/fonts` from T2 used by T3.
