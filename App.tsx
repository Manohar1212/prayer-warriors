import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { NewRequestForm } from './src/components/NewRequestForm';
import { PrayerRequestCard } from './src/components/PrayerRequestCard';
import { usePrayerRequests } from './src/hooks/usePrayerRequests';
import { colors, spacing } from './src/theme';

function Board() {
  const { requests, loading, refreshing, error, refresh, add, pray } = usePrayerRequests();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListHeaderComponent={
            <View>
              <Text style={styles.appTitle}>Prayer Warriors</Text>
              <Text style={styles.appSubtitle}>Lift each other up.</Text>
              <NewRequestForm onSubmit={add} />
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={colors.accent} style={styles.spinner} />
            ) : (
              <Text style={styles.empty}>No requests yet. Be the first to share one.</Text>
            )
          }
          renderItem={({ item }) => <PrayerRequestCard request={item} onPray={pray} />}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Board />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  appTitle: { fontSize: 28, fontWeight: '700', color: colors.ink },
  appSubtitle: { fontSize: 15, color: colors.muted, marginBottom: spacing.lg },
  error: { color: colors.danger, marginBottom: spacing.md },
  spinner: { marginTop: spacing.xl },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
});
