import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/community/CommunityVoiceScreen.tsx',
  'src/pages/community/CommunityExperiencesScreen.tsx',
  'src/pages/misc/SearchScreen.tsx',
  'src/pages/misc/PanchangScreen.tsx',
  'src/pages/misc/BlogScreen.tsx',
  'src/pages/misc/EventsScreen.tsx',
  'src/pages/profile/NotificationsScreen.tsx',
  'src/pages/profile/HistoryScreen.tsx',
  'src/pages/profile/DownloadsScreen.tsx',
  'src/pages/profile/WishlistScreen.tsx',
  'src/pages/profile/EditProfileScreen.tsx',
  'src/pages/profile/SettingsScreen.tsx',
  'src/pages/profile/OrdersScreen.tsx',
  'src/pages/profile/BookmarksScreen.tsx',
  'src/pages/info/ContactScreen.tsx',
  'src/pages/info/PrivacyPolicyScreen.tsx',
  'src/pages/info/GalleryScreen.tsx',
  'src/pages/info/FounderScreen.tsx',
  'src/pages/info/MissionScreen.tsx',
  'src/pages/info/QuotesScreen.tsx',
  'src/pages/info/TermsScreen.tsx',
  'src/pages/info/AboutScreen.tsx',
  'src/pages/store/CheckoutScreen.tsx',
  'src/pages/store/CartScreen.tsx',
  'src/pages/store/TrackOrderScreen.tsx',
  'src/pages/store/ProductDetailsScreen.tsx',
  'src/pages/adhyayan/CategoryDetailsScreen.tsx',
  'src/pages/adhyayan/VideoPlayerScreen.tsx',
  'src/pages/adhyayan/PDFViewerScreen.tsx',
  'src/pages/chanting/ChantingScreen.tsx'
];

for (const file of files) {
  const filePath = path.resolve(file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('useGoBack')) {
    // Add import statement at the top (after other imports)
    const importMatch = content.match(/import .*?;?\n/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const hookPath = file.split('/').length > 3 ? '../../hooks/useGoBack' : '../hooks/useGoBack';
      // calculate correct relative path to src/hooks/useGoBack
      const depth = file.split('/').length - 2;
      const relativePath = depth === 1 ? '../hooks/useGoBack' : depth === 2 ? '../../hooks/useGoBack' : '../../../hooks/useGoBack';
      
      content = content.replace(lastImport, lastImport + `import { useGoBack } from "${relativePath}";\n`);
    }

    // Replace const navigate = useNavigate(); with const navigate = useNavigate();\n  const goBack = useGoBack();
    if (content.includes('const navigate = useNavigate();')) {
      content = content.replace('const navigate = useNavigate();', 'const navigate = useNavigate();\n  const goBack = useGoBack();');
    } else {
      // Find the component body start and insert it
      const componentMatch = content.match(/export const [A-Za-z]+ = \(\) => {\n/);
      if (componentMatch) {
        content = content.replace(componentMatch[0], componentMatch[0] + '  const goBack = useGoBack();\n');
      } else {
         const componentMatch2 = content.match(/export default function [A-Za-z]+\(.*\) {\n/);
         if (componentMatch2) {
           content = content.replace(componentMatch2[0], componentMatch2[0] + '  const goBack = useGoBack();\n');
         }
      }
    }

    fs.writeFileSync(filePath, content, 'utf8');
  }
}
