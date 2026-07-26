export const getYoutubeId = (url: string) => {
  if (!url) return null;
  // Handle shorts specifically
  if (url.includes('/shorts/')) {
    const parts = url.split('/shorts/');
    if (parts[1]) {
      const id = parts[1].split(/[?#&]/)[0];
      if (id && id.length === 11) return id;
    }
  }
  // Standard regExp
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  // Try fallback search params
  try {
    const urlObj = new URL(url);
    const v = urlObj.searchParams.get('v');
    if (v && v.length === 11) return v;
  } catch (e) {}
  return null;
};

export const getCloudinaryDetails = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (url.includes("player.cloudinary.com/embed")) {
      const cloudName = urlObj.searchParams.get("cloud_name");
      const publicId = urlObj.searchParams.get("public_id");
      return { cloudName, publicId };
    }
    const parts = urlObj.pathname.split("/");
    if (parts.length > 4 && urlObj.hostname.includes("res.cloudinary.com")) {
      const cloudName = parts[1];
      const publicIdWithExt = parts[parts.length - 1];
      const publicId = publicIdWithExt.split(".")[0];
      return { cloudName, publicId };
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const getVideoThumbnail = (video: any) => {
  if (!video) return "";
  if (
    video.thumbnailUrl &&
    typeof video.thumbnailUrl === "string" &&
    video.thumbnailUrl.trim() !== ""
  ) {
    return video.thumbnailUrl;
  }
  if (
    video.thumbnail &&
    typeof video.thumbnail === "string" &&
    video.thumbnail.trim() !== "" &&
    !video.thumbnail.includes("picsum.photos")
  ) {
    return video.thumbnail;
  }

  const getUrl = (keys: string[]) => {
    for (const key of keys) {
      const val = video[key];
      if (val && typeof val === "string" && val.trim() !== "")
        return val.trim();
      if (val && typeof val === "object" && val.url) return val.url.trim();
    }
    return null;
  };

  const ytUrl = getUrl([
    "youtubeUrl",
    "youtubeURL",
    "youtubeLink",
    "youtube",
    "videoUrl",
    "url",
  ]);
  const clUrl = getUrl([
    "cloudinaryUrl",
    "cloudinaryURL",
    "videoUrl",
    "videoURL",
    "url",
    "videoLink",
    "fileUrl",
    "sourceUrl",
  ]);

  const isYt = (url: string) =>
    url?.includes("youtube.com") || url?.includes("youtu.be");
  const isCl = (url: string) => url?.includes("cloudinary.com");

  const actualYt = isYt(ytUrl) ? ytUrl : isYt(clUrl) ? clUrl : null;
  const actualCl = isCl(clUrl) ? clUrl : isCl(ytUrl) ? ytUrl : null;

  if (actualYt) {
    const ytId = getYoutubeId(actualYt);
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    }
  }

  if (actualCl) {
    const details = getCloudinaryDetails(actualCl);
    if (details && details.cloudName && details.publicId) {
      return `https://res.cloudinary.com/${details.cloudName}/video/upload/w_800,q_auto,f_jpg/${details.publicId}.jpg`;
    }
  }

  return video.thumbnail || `https://picsum.photos/seed/vid${video.id}/800/450`;
};

// Simple format function
export const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// Tries to get the video duration if it's missing
export const fetchMissingDuration = (
  videoUrl: string,
): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!videoUrl) return resolve(null);

    // For direct video URLs (Cloudinary, mp4, etc.)
    if (videoUrl.includes("cloudinary.com") || videoUrl.endsWith(".mp4")) {
      const videoElement = document.createElement("video");
      videoElement.src = videoUrl;
      videoElement.preload = "metadata";

      videoElement.onloadedmetadata = () => {
        if (videoElement.duration && videoElement.duration !== Infinity) {
          resolve(formatDuration(videoElement.duration));
        } else {
          resolve(null);
        }
      };

      videoElement.onerror = () => resolve(null);

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    }
    // For YouTube, it's blocked by CORS for raw requests without API.
    // In a real prod scenario, we'd use the YouTube Data API from a cloud function.
    // We will return null so that fallback logic can handle it.
    else {
      resolve(null);
    }
  });
};
