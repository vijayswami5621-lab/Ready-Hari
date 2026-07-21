export const getApiUrl = (url: string): string => {
  if (url.startsWith('/api/')) {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    if (baseUrl) {
      return `${baseUrl.replace(/\/$/, '')}${url}`;
    }
  }
  return url;
};

export const fetchApi = async (url: string, options?: RequestInit) => {
  const finalUrl = getApiUrl(url);
  const response = await fetch(finalUrl, options);
  const responseClone = response.clone();
  
  let data;
  let text = '';
  
  try {
    text = await responseClone.text();
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = text; // Fallback to text if not JSON
  }
  
  if (!response.ok) {
    let errorMsg = 'An error occurred while processing your request.';
    if (typeof data === 'object' && data?.error) {
      errorMsg = data.error;
    } else if (typeof data === 'string' && !data.trim().startsWith('<')) {
      errorMsg = data;
    }
    throw new Error(errorMsg);
  }
  
  return data;
};
