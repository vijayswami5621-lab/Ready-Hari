import { useAppSettings } from '../contexts/AppSettingsContext';
import { Share } from '@capacitor/share';

export const useShareContent = () => {
  const { settings } = useAppSettings();

  const extractDocId = (urlPath: string) => {
    if (!urlPath) return 'hari-pathshala';
    const parts = urlPath.split('/').filter(Boolean);
    return parts[parts.length - 1];
  };

  const shareContent = async ({
    title,
    text,
    urlPath,
    documentId,
    dialogTitle
  }: {
    title?: string;
    text?: string;
    urlPath?: string;
    documentId?: string;
    dialogTitle?: string;
  }) => {
    try {
      const config: any = settings?.shareConfig || {
        appUrl: 'https://play.google.com/store/apps/details?id=com.haripathshala',
        shareEnabled: true,
        defaultTitle: 'Hari Pathshala',
        defaultDescription: '',
        socialCaption: 'Jai Siyaram 🙏',
      };

      if (config.shareEnabled === false) {
         alert("Sharing is currently disabled.");
         return false;
      }

      const docId = documentId || extractDocId(urlPath || '');
      const appUrl = config.appUrl || settings?.appUrl || 'https://play.google.com/store/apps/details?id=com.haripathshala';
      
      const shareTitle = title || config.defaultTitle || 'Hari Pathshala';
      const desc = text || config.defaultDescription || '';
      
      let combinedText = `🌿 Hari Pathshala

${shareTitle}`;

      if (desc) {
         combinedText += `

${desc}`;
      }

      combinedText += `

📲 Install Hari Pathshala:
${appUrl}

Content ID:
${docId}

${config.socialCaption || '🙏 Jai Siyaram'}`;

      const { value } = await Share.canShare();
      
      if (value || (navigator && navigator.share)) {
        try {
          await Share.share({
            title: shareTitle,
            text: combinedText,
            dialogTitle: dialogTitle || 'Share with friends',
          });
        } catch (err: any) {
          const msg = err?.message || err?.toString() || '';
          if (msg.includes('canceled') || msg.includes('cancel') || msg.includes('AbortError')) {
             return false;
          }
          if (navigator.clipboard && document.hasFocus()) {
            try {
              await copyToClipboard(docId, appUrl);
            } catch(clipboardErr) {
              console.warn("Clipboard fallback failed", clipboardErr);
            }
          }
        }
      } else {
        if (navigator.clipboard) {
          await copyToClipboard(docId, appUrl);
        }
      }
      return true;
    } catch (e: any) {
      console.error('Share error:', e);
      return false;
    }
  };

  const copyToClipboard = async (docId: string, appUrl?: string): Promise<boolean> => {
    try {
      const config: any = settings?.shareConfig || { shareEnabled: true };
      
      if (config.shareEnabled === false) {
         alert("Sharing is currently disabled.");
         return false;
      }

      const finalAppUrl = appUrl || config.appUrl || 'https://play.google.com/store/apps/details?id=com.haripathshala';
      
      const copyText = `Hari Pathshala

Content ID:
${docId}

Install the App:
${finalAppUrl}`;

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(copyText);
        alert("Copied to clipboard successfully.");
        return true;
      }
      return false;
    } catch (e) {
      console.error('Copy error:', e);
      return false;
    }
  };

  return { shareContent, copyToClipboard };
};
