import { Stack } from 'expo-router';
import DeepLinkHandler from '../components/DeepLinkHandler';
import { CompanyProvider } from '../contexts/CompanyContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { UnreadProvider } from '../contexts/UnreadContext';

export default function RootLayout() {
  return (
    <CompanyProvider>
      <LanguageProvider>
        <UnreadProvider>
          <DeepLinkHandler />
          <Stack screenOptions={{ headerShown: false }} />
        </UnreadProvider>
      </LanguageProvider>
    </CompanyProvider>
  );
}
