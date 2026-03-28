import { Stack } from 'expo-router';
import DeepLinkHandler from '../components/DeepLinkHandler';
import { CompanyProvider } from '../contexts/CompanyContext';
import { LanguageProvider } from '../contexts/LanguageContext';

export default function RootLayout() {
  return (
    <CompanyProvider>
      <LanguageProvider>
        <DeepLinkHandler />
        <Stack screenOptions={{ headerShown: false }} />
      </LanguageProvider>
    </CompanyProvider>
  );
}
