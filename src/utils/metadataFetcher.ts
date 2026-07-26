import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { getYoutubeId, getCloudinaryDetails } from "./videoUtils";

export const fetchYoutubeMetadata = async (videoId: string) => {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        durationSeconds: 0,
        duration: "0:00",
        channelName: data.author_name || "",
        publishDate: "",
      };
    }
  } catch (error) {
    console.warn("YouTube oEmbed fetch failed, trying proxy...", error);
  }

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);
    const data = await response.json();

    if (data && data.contents) {
      const html = data.contents;

      // Extract duration
      const lengthMatch = html.match(/"lengthSeconds":"(\d+)"/);
      let durationSeconds = 0;
      if (lengthMatch && lengthMatch[1]) {
        durationSeconds = parseInt(lengthMatch[1], 10);
      }

      // Extract channel name
      const channelMatch = html.match(/"ownerChannelName":"(.*?)"/);
      const channelName = channelMatch ? channelMatch[1] : "";

      // Extract publish date
      const dateMatch = html.match(/"publishDate":"(.*?)"/);
      const publishDate = dateMatch ? dateMatch[1] : "";

      // Format duration (HH:MM:SS)
      let durationStr = "0:00";
      if (durationSeconds > 0) {
        const h = Math.floor(durationSeconds / 3600);
        const m = Math.floor((durationSeconds % 3600) / 60);
        const s = durationSeconds % 60;
        if (h > 0) {
          durationStr = `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        } else {
          durationStr = `${m}:${s.toString().padStart(2, "0")}`;
        }
      }

      return {
        durationSeconds,
        duration: durationStr,
        channelName,
        publishDate,
      };
    }
  } catch (error) {
    console.warn("Failed to fetch YouTube metadata gracefully", error);
  }
  return null;
};

export const fetchCloudinaryMetadata = (url: string): Promise<any> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = function () {
      window.URL.revokeObjectURL(video.src);
      const durationSeconds = video.duration;

      let durationStr = "0:00";
      if (durationSeconds > 0) {
        const h = Math.floor(durationSeconds / 3600);
        const m = Math.floor((durationSeconds % 3600) / 60);
        const s = Math.floor(durationSeconds % 60);
        if (h > 0) {
          durationStr = `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        } else {
          durationStr = `${m}:${s.toString().padStart(2, "0")}`;
        }
      }

      resolve({
        durationSeconds,
        duration: durationStr,
        resolution: `${video.videoWidth}x${video.videoHeight}`,
      });
    };

    video.onerror = function () {
      resolve(null);
    };

    video.src = url;
  });
};

// Auto-cacher function to run when video is loaded
export const autoFetchVideoMetadata = async (videoDoc: any) => {
  // If it already has duration and we don't need to force refresh, skip
  if (videoDoc.duration && videoDoc.duration !== "0:00") {
    return;
  }

  // Prevent multiple simultaneous fetches
  const cacheKey = `fetching_meta_${videoDoc.id}`;
  if (sessionStorage.getItem(cacheKey)) {
    return;
  }
  sessionStorage.setItem(cacheKey, "true");

  try {
    let updates: any = {};

    // Identify Source
    let ytUrl =
      videoDoc.youtubeUrl ||
      videoDoc.youtubeURL ||
      videoDoc.youtubeLink ||
      videoDoc.youtube;
    let clUrl =
      videoDoc.cloudinaryUrl ||
      videoDoc.cloudinaryURL ||
      videoDoc.videoUrl ||
      videoDoc.videoURL ||
      videoDoc.url;

    const ytId = ytUrl ? getYoutubeId(ytUrl) : null;
    const clDetails = clUrl ? getCloudinaryDetails(clUrl) : null;

    if (ytId) {
      updates.sourceType = "youtube";
      updates.youtubeVideoId = ytId;
      updates.thumbnailUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;

      const meta = await fetchYoutubeMetadata(ytId);
      if (meta) {
        updates.duration = meta.duration;
        if (meta.channelName) updates.channelName = meta.channelName;
        if (meta.publishDate) updates.publishDate = meta.publishDate;
      }
    } else if (clDetails && clDetails.cloudName && clDetails.publicId) {
      updates.sourceType = "cloudinary";
      updates.cloudinaryPublicId = clDetails.publicId;
      updates.thumbnailUrl = `https://res.cloudinary.com/${clDetails.cloudName}/video/upload/w_800,q_auto,f_jpg/${clDetails.publicId}.jpg`;

      // Ensure we have a direct MP4 link for metadata fetch
      let directUrl = clUrl;
      if (clUrl.includes("player.cloudinary.com/embed")) {
        directUrl = `https://res.cloudinary.com/${clDetails.cloudName}/video/upload/${clDetails.publicId}.mp4`;
      }

      const meta = await fetchCloudinaryMetadata(directUrl);
      if (meta) {
        updates.duration = meta.duration;
        updates.videoResolution = meta.resolution;
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString();
      await updateDoc(doc(db, "videos", videoDoc.id), updates);
    }
  } catch (err) {
    console.warn("Auto meta fetch failed gracefully", err);
  } finally {
    sessionStorage.removeItem(cacheKey);
  }
};
