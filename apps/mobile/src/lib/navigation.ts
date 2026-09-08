import type { Href, useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

/** Go back if there is history; otherwise land on a sensible screen (deep links, web reloads). */
export function goBackOr(router: Router, fallback: Href): void {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
