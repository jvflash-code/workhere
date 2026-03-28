import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useActiveCompany } from '../contexts/CompanyContext';

export default function DeepLinkHandler() {
  const { setCompanyBySlug } = useActiveCompany();

  useEffect(() => {
    // Handle URL that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Handle URLs while app is open
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, []);

  function handleDeepLink(url: string) {
    const parsed = Linking.parse(url);
    // Handle workhere://company/acme-corp or https://whyworkhere.app/c/acme-corp
    if (parsed.path?.startsWith('company/')) {
      const slug = parsed.path.replace('company/', '');
      if (slug) setCompanyBySlug(slug);
    }
  }

  return null;
}
