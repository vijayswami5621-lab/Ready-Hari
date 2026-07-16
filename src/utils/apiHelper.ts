export const fetchApi = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
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
