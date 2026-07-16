import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  Download,
  FileText,
  Settings,
  Check,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Languages,
  Gauge,
  Eye,
  RefreshCw,
  Tv
} from 'lucide-react';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { SEO } from '../../components/SEO';
import { getVideoThumbnail } from '../../utils/videoUtils';
import { useAuthStore } from '../../store/useAuthStore';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ReactPlayer from 'react-player';
import { autoFetchVideoMetadata } from '../../utils/metadataFetcher';
import { useGoBack } from "../../hooks/useGoBack";
import { NotFoundScreen } from "../misc/NotFoundScreen";
import { useShareContent } from "../../hooks/useShareContent";
import { SecureImage } from '../../components/common/SecureImage';

const Player: any = ReactPlayer;

// Demo spiritual Subtitles (WebVTT encoded inside Data URI for safe client-side loading)
const generateWebVTT = () => {
  return `WEBVTT

1
00:00:01.000 --> 00:00:05.000
Hari Pathshala presents: Divine Sadhana

2
00:00:06.000 --> 00:00:12.000
Sadhana brings deep peace, spiritual discipline, and divine connection.

3
00:00:15.000 --> 00:00:23.000
Welcome to this sacred learning module. Listen carefully to Swami Ji.

4
00:00:25.000 --> 00:00:32.000
May pure cosmic energy elevate your consciousness.

5
00:00:35.000 --> 00:01:40.000
Jai Siyaram! 🙏 Let us begin recitation.`;
};

const vttDataUrl = "data:text/vtt;charset=utf-8," + encodeURIComponent(generateWebVTT());

export const VideoPlayerScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { shareContent } = useShareContent();
  const { user } = useAuthStore();

  const [showControls, setShowControls] = useState(true);
  const [playerError, setPlayerError] = useState(false);
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [userDownloads, setUserDownloads] = useState<string[]>([]);

  // Playlist Controls
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [startPosition, setStartPosition] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Custom Controls States for Cloudinary/HTML5 Video
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [quality, setQuality] = useState("Auto"); // Auto, 1080p, 720p, 480p
  const [isSubtitlesOn, setIsSubtitlesOn] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<"main" | "speed" | "quality" | "subtitles">("main");

  const playerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: dbVideos, loading } = useRealtimeCollection<any>('videos');
  const video = dbVideos.find(v => v.id === id);

  useEffect(() => {
    setHasStarted(false);
    setStartPosition(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setShowSettingsMenu(false);
    setSettingsActiveTab("main");
  }, [id]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (user && video) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.continueWatching && data.continueWatching[video.id]) {
               const savedTime = data.continueWatching[video.id].lastPosition;
               if (savedTime && savedTime > 0) {
                 setStartPosition(savedTime);
               }
            }
          }
        } catch (e) {}
      }
    };
    fetchHistory();
  }, [user, video]);

  const handleYtReady = () => {
    setIsPlaying(true);
    if (startPosition > 0 && playerRef.current && !hasStarted) {
      try {
        playerRef.current.seekTo(startPosition, 'seconds');
        setHasStarted(true);
      } catch(e) {}
    }
  };

  const handleClLoaded = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      if (startPosition > 0 && !hasStarted) {
        try {
          videoRef.current.currentTime = startPosition;
          setHasStarted(true);
        } catch(e) {}
      }
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e: any) => console.log('Playback prevented', e));
    }
  };

  useEffect(() => {
    if (startPosition > 0 && !hasStarted) {
      if (playerRef.current) {
        try {
          playerRef.current.seekTo(startPosition, 'seconds');
          setHasStarted(true);
        } catch(e) {}
      } else if (videoRef.current) {
        try {
          videoRef.current.currentTime = startPosition;
          setHasStarted(true);
        } catch(e) {}
      }
    }
  }, [startPosition]);

  useEffect(() => {
    if (video && (!video.duration || video.duration === '0:00')) {
      autoFetchVideoMetadata(video);
    }
  }, [video]);

  useEffect(() => {
    let unsubscribe: () => void;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserBookmarks(docSnap.data().bookmarkedVideos || []);
          setUserLikes(docSnap.data().likedVideos || []);
          setUserDownloads(docSnap.data().downloadedVideos || []);
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Handle Fullscreen Event Changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Handle Autohide Controls Bar after inactivity
  useEffect(() => {
    if (isPlaying && showControls) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (!showSettingsMenu) {
          setShowControls(false);
        }
      }, 3500);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, showControls, showSettingsMenu]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!loading && (!video || video.publishStatus === false || video.publishStatus === 'draft' || video.isActive === false)) {
    return <NotFoundScreen />;
  }

  // Auto detect video source
  let playUrl = "";
  let isYouTube = false;

  const getUrl = (keys: string[]) => {
    for (const key of keys) {
      const val = video[key];
      if (!val) continue;
      
      if (typeof val === 'string' && val.trim() !== '') {
        return val.trim();
      }
      if (typeof val === 'object') {
         if (val.url && typeof val.url === 'string' && val.url.trim() !== '') return val.url.trim();
         if (val.secure_url && typeof val.secure_url === 'string' && val.secure_url.trim() !== '') return val.secure_url.trim();
      }
    }
    return null;
  };

  let ytUrl = getUrl(['youtubeUrl', 'youtubeURL', 'youtubeLink', 'youtube']);
  let clUrl = getUrl(['cloudinaryUrl', 'cloudinaryURL', 'videoUrl', 'videoURL', 'url', 'videoLink', 'fileUrl', 'sourceUrl']);
  const srcType = typeof video.videoSource === 'string' ? video.videoSource.toLowerCase() : (typeof video.source === 'string' ? video.source.toLowerCase() : (typeof video.video_source === 'string' ? video.video_source.toLowerCase() : ''));

  // Cloudinary embed to MP4 fix:
  if (clUrl && clUrl.includes('player.cloudinary.com/embed')) {
      try {
          const urlObj = new URL(clUrl);
          const cloudName = urlObj.searchParams.get('cloud_name');
          const publicId = urlObj.searchParams.get('public_id');
          if (cloudName && publicId) {
              clUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}.mp4`;
          }
      } catch (e) {
          console.error("Invalid Cloudinary URL", e);
      }
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isYtUrlString = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');
  const isClUrlString = (url: string) => url.includes('cloudinary.com');

  if (clUrl && isYtUrlString(clUrl) && !ytUrl) {
    ytUrl = clUrl;
    clUrl = null;
  }
  
  if (ytUrl && isClUrlString(ytUrl) && !clUrl) {
    clUrl = ytUrl;
    ytUrl = null;
  }

  if (srcType === 'youtube' && ytUrl && isValidUrl(ytUrl)) {
    playUrl = ytUrl;
    isYouTube = true;
  } else if (srcType === 'cloudinary' && clUrl && isValidUrl(clUrl)) {
    playUrl = clUrl;
    isYouTube = false;
  } else if (ytUrl && isValidUrl(ytUrl)) {
    playUrl = ytUrl;
    isYouTube = true;
  } else if (clUrl && isValidUrl(clUrl)) {
    playUrl = clUrl;
    isYouTube = false;
  }

  // Cloudinary Dynamic Resolution Transformations on raw playUrl
  const getTransformedUrl = (url: string, res: string) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    try {
      let segment = 'q_auto';
      if (res === '1080p') segment = 'w_1920,h_1080,c_limit,q_auto';
      else if (res === '720p') segment = 'w_1280,h_720,c_limit,q_auto';
      else if (res === '480p') segment = 'w_854,h_480,c_limit,q_auto';

      if (url.includes('/upload/')) {
        return url.replace('/upload/', `/upload/${segment}/`);
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  const transformedPlayUrl = isYouTube ? playUrl : getTransformedUrl(playUrl, quality);

  // PLAYLIST LOGIC
  const playlistVideos = dbVideos
    .filter(v => (v.category === video.category || v.categoryId === video.categoryId) && v.publishStatus !== 'draft' && v.isActive !== false)
    .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const currentIndex = playlistVideos.findIndex(v => v.id === video.id);
  const nextVideo = playlistVideos[currentIndex + 1];
  const prevVideo = playlistVideos[currentIndex - 1];

  const handleNextVideo = () => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * playlistVideos.length);
      navigate(`/adhyayan/video/${playlistVideos[randomIndex].id}`);
    } else if (nextVideo) {
      navigate(`/adhyayan/video/${nextVideo.id}`);
    } else if (isRepeat && playlistVideos.length > 0) {
      navigate(`/adhyayan/video/${playlistVideos[0].id}`);
    }
  };

  const handlePrevVideo = () => {
    if (prevVideo) {
      navigate(`/adhyayan/video/${prevVideo.id}`);
    }
  };

  const handleVideoEnded = () => {
    if (autoPlayNext) {
      handleNextVideo();
    } else {
      setIsPlaying(false);
    }
  };

  // Continue Watching Save Progress
  const handleProgress = async (state: { playedSeconds: number, played: number }) => {
    setCurrentTime(state.playedSeconds);
    if (user && video.id) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, {
          continueWatching: {
            [video.id]: {
              lastPosition: state.playedSeconds,
              percentage: state.played * 100,
              updatedAt: new Date().toISOString()
            }
          }
        }, { merge: true });
      } catch (err) {
        // fail silently
      }
    }
  };

  // Custom Controls Event Actions for Cloudinary Player
  const togglePlay = () => {
    if (isYouTube) {
      setIsPlaying(!isPlaying);
      return;
    }
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((e: any) => console.log('Play error', e));
      }
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSpeedSelect = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettingsMenu(false);
  };

  const handleQualitySelect = (q: string) => {
    const savedTime = currentTime;
    setQuality(q);
    setShowSettingsMenu(false);
    // Reload source with saved time
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = savedTime;
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    }, 150);
  };

  const handleSubtitlesToggle = () => {
    setIsSubtitlesOn(!isSubtitlesOn);
    setShowSettingsMenu(false);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        // Force Landscape layout lock if API is available
        if (window.screen.orientation && (window.screen.orientation as any).lock) {
          (window.screen.orientation as any).lock("landscape").catch(() => {});
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        if (window.screen.orientation && window.screen.orientation.unlock) {
          window.screen.orientation.unlock();
        }
      }
    } catch (e) {
      console.log("Fullscreen Error", e);
    }
  };

  const togglePictureInPicture = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.log("PiP Error", e);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleLike = async () => {
    if (!user || !video.id) {
      alert("Please login to like videos");
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    const isLiked = userLikes.includes(video.id);
    try {
      if (isLiked) {
        await setDoc(userRef, { likedVideos: arrayRemove(video.id) }, { merge: true });
        setUserLikes(prev => prev.filter(vidId => vidId !== video.id));
      } else {
        await setDoc(userRef, { likedVideos: arrayUnion(video.id) }, { merge: true });
        setUserLikes(prev => [...prev, video.id]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookmark = async () => {
    if (!user || !video.id) {
      alert("Please login to bookmark videos");
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    const isBookmarked = userBookmarks.includes(video.id);
    try {
      if (isBookmarked) {
        await updateDoc(userRef, { bookmarkedVideos: arrayRemove(video.id) });
      } else {
        await updateDoc(userRef, { bookmarkedVideos: arrayUnion(video.id) });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = async () => {
    if (isYouTube) {
      alert("Video download is not available for this source.");
      return;
    }
    if (!user || !video.id) {
      alert("Please login to download videos for offline viewing");
      return;
    }
    
    if (playUrl) {
      try {
        const response = await fetch(playUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = (video.title || 'video') + '.mp4';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Error downloading the video", err);
        window.open(playUrl, '_blank');
      }
    }

    const userRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userRef, { downloadedVideos: arrayUnion(video.id) }, { merge: true });
      setUserDownloads(prev => [...prev, video.id]);
      alert("Video download initiated successfully!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    if (!video) return;
    await shareContent({
      title: video.title,
      urlPath: `/adhyayan/video/${video.id}`
    });
  };

  if (loading && !dbVideos.length) {
    return (
      <div className="flex flex-col h-screen bg-black justify-center items-center">
        <div className="w-12 h-12 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-white dark:bg-slate-900 transition-colors overflow-hidden xl:flex-row">
      <SEO title={`${video.title} | Adhyayan`} description={video.description} />
      
      {/* LEFT COLUMN (Player & Details) */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        
        {/* ENHANCED VIDEO PLAYER STAGE */}
        <div 
          ref={containerRef}
          className="relative w-full aspect-video bg-black shrink-0 flex items-center justify-center group z-10 select-none overflow-hidden"
          onMouseMove={() => setShowControls(true)}
          onTouchStart={() => setShowControls(true)}
        >
          {/* HEADER BACK BUTTON */}
          {showControls && (
            <div className="absolute top-4 left-4 z-30 flex items-center gap-4 transition-opacity duration-350">
               <button onClick={() => navigate(-1)} className="text-white bg-black/40 p-2.5 rounded-full hover:bg-black/60 transition backdrop-blur-md">
                 <ArrowLeft size={20} />
               </button>
            </div>
          )}
          
          {/* PLAYER CORE */}
          <div className="w-full h-full bg-black relative flex items-center justify-center">
            {playerError ? (
              <div className="flex flex-col items-center justify-center p-6 text-center z-20">
                <p className="text-white text-sm mb-4">
                  {isYouTube ? "Unable to load YouTube stream." : "Unable to load Cloudinary video."}
                </p>
                <div className="flex gap-4">
                  <button onClick={() => navigate(-1)} className="bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition">
                    Back
                  </button>
                  <button onClick={() => setPlayerError(false)} className="bg-saffron text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-saffron-dark transition">
                    Retry
                  </button>
                </div>
              </div>
            ) : transformedPlayUrl ? (
              isYouTube ? (
                <Player
                  ref={playerRef}
                  url={transformedPlayUrl}
                  width="100%"
                  height="100%"
                  controls={true}
                  playing={isPlaying}
                  onError={() => setPlayerError(true)}
                  onReady={handleYtReady}
                  onEnded={handleVideoEnded}
                  onProgress={handleProgress}
                  config={{
                    youtube: {
                      playerVars: { showinfo: 1, rel: 0, modestbranding: 1 }
                    }
                  }}
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={transformedPlayUrl}
                    className="w-full h-full object-contain"
                    playsInline
                    controlsList="nodownload"
                    onClick={togglePlay}
                    onError={() => setPlayerError(true)}
                    onLoadedMetadata={handleClLoaded}
                    onEnded={handleVideoEnded}
                    onTimeUpdate={(e) => {
                      const target = e.target as HTMLVideoElement;
                      handleProgress({ playedSeconds: target.currentTime, played: target.currentTime / (target.duration || 1) });
                    }}
                    poster={getVideoThumbnail(video)}
                  >
                    {isSubtitlesOn && (
                      <track 
                        kind="captions" 
                        src={vttDataUrl} 
                        srcLang="hi" 
                        label="Sadhana Recitations" 
                        default 
                      />
                    )}
                  </video>

                  {/* PREMIUM CUSTOM CONTROLS OVERLAY FOR CLOUDINARY */}
                  {showControls && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 flex flex-col justify-between p-4 z-20 transition-all duration-300">
                      
                      {/* Top Bar Label */}
                      <div className="flex justify-between items-start pointer-events-none opacity-90">
                        <div className="hidden sm:block text-white text-xs font-medium pl-14 pt-1">
                          Playing: <span className="font-bold">{video.title}</span>
                        </div>
                      </div>

                      {/* Center Play/Pause Overlay */}
                      <div className="flex items-center justify-center gap-6 pointer-events-none">
                        <button 
                          onClick={togglePlay}
                          className="w-14 h-14 bg-saffron text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 pointer-events-auto"
                        >
                          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
                        </button>
                      </div>

                      {/* Bottom Controls Bar */}
                      <div className="space-y-3 pointer-events-auto">
                        
                        {/* Seek Slider bar */}
                        <div className="flex items-center gap-3">
                          <input 
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeekChange}
                            className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-saffron"
                          />
                        </div>

                        {/* Control buttons line */}
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-4">
                            <button onClick={togglePlay} className="hover:text-saffron transition">
                              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                            </button>

                            {/* Prev/Next buttons */}
                            <button onClick={handlePrevVideo} disabled={!prevVideo} className="disabled:opacity-40 hover:text-saffron transition">
                              <SkipBack size={18} fill="currentColor" />
                            </button>
                            <button onClick={handleNextVideo} disabled={!nextVideo} className="disabled:opacity-40 hover:text-saffron transition">
                              <SkipForward size={18} fill="currentColor" />
                            </button>

                            {/* Volume bar */}
                            <div className="flex items-center gap-2 group/volume">
                              <button onClick={toggleMute} className="hover:text-saffron transition">
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                              </button>
                              <input 
                                type="range"
                                min={0}
                                max={1}
                                step={0.1}
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white hidden sm:block"
                              />
                            </div>

                            {/* Time Display */}
                            <span className="text-[11px] font-mono opacity-90">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                          </div>

                          {/* Right Side Controls */}
                          <div className="flex items-center gap-4 relative">
                            {/* PiP button */}
                            <button onClick={togglePictureInPicture} className="hover:text-saffron transition" title="Picture in Picture">
                              <Tv size={18} />
                            </button>

                            {/* Settings button */}
                            <button 
                              onClick={() => {
                                setShowSettingsMenu(!showSettingsMenu);
                                setSettingsActiveTab("main");
                              }} 
                              className={`hover:text-saffron transition ${showSettingsMenu ? 'text-saffron rotate-45' : ''}`}
                            >
                              <Settings size={18} />
                            </button>

                            {/* Fullscreen button */}
                            <button onClick={toggleFullscreen} className="hover:text-saffron transition">
                              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                            </button>

                            {/* Settings Popup Menu */}
                            {showSettingsMenu && (
                              <div className="absolute bottom-10 right-0 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 w-52 shadow-2xl backdrop-blur-md text-xs z-50 space-y-2">
                                {settingsActiveTab === "main" && (
                                  <>
                                    <div className="font-bold border-b border-slate-700/60 pb-1.5 text-slate-300">Settings</div>
                                    <button 
                                      onClick={() => setSettingsActiveTab("speed")} 
                                      className="flex items-center justify-between w-full py-1.5 text-left hover:bg-slate-800 rounded px-2"
                                    >
                                      <span className="flex items-center gap-1.5 text-slate-400"><Gauge size={12} /> Playback Speed</span>
                                      <span className="font-bold text-saffron">{playbackSpeed}x</span>
                                    </button>
                                    <button 
                                      onClick={() => setSettingsActiveTab("quality")} 
                                      className="flex items-center justify-between w-full py-1.5 text-left hover:bg-slate-800 rounded px-2"
                                    >
                                      <span className="flex items-center gap-1.5 text-slate-400"><Eye size={12} /> Quality</span>
                                      <span className="font-bold text-saffron">{quality}</span>
                                    </button>
                                    <button 
                                      onClick={() => setSettingsActiveTab("subtitles")} 
                                      className="flex items-center justify-between w-full py-1.5 text-left hover:bg-slate-800 rounded px-2"
                                    >
                                      <span className="flex items-center gap-1.5 text-slate-400"><Languages size={12} /> Subtitles</span>
                                      <span className="font-bold text-saffron">{isSubtitlesOn ? "Hindi" : "Off"}</span>
                                    </button>
                                  </>
                                )}

                                {settingsActiveTab === "speed" && (
                                  <>
                                    <div className="font-bold border-b border-slate-700/60 pb-1.5 flex items-center gap-2">
                                      <button onClick={() => setSettingsActiveTab("main")} className="text-saffron hover:underline">←</button>
                                      <span>Select Speed</span>
                                    </div>
                                    {[0.5, 1.0, 1.25, 1.5, 2.0].map((s) => (
                                      <button 
                                        key={s} 
                                        onClick={() => handleSpeedSelect(s)}
                                        className="flex items-center justify-between w-full py-1.5 px-2 hover:bg-slate-800 rounded text-left"
                                      >
                                        <span>{s}x</span>
                                        {playbackSpeed === s && <Check size={12} className="text-saffron" />}
                                      </button>
                                    ))}
                                  </>
                                )}

                                {settingsActiveTab === "quality" && (
                                  <>
                                    <div className="font-bold border-b border-slate-700/60 pb-1.5 flex items-center gap-2">
                                      <button onClick={() => setSettingsActiveTab("main")} className="text-saffron hover:underline">←</button>
                                      <span>Select Resolution</span>
                                    </div>
                                    {["Auto", "1080p", "720p", "480p"].map((q) => (
                                      <button 
                                        key={q} 
                                        onClick={() => handleQualitySelect(q)}
                                        className="flex items-center justify-between w-full py-1.5 px-2 hover:bg-slate-800 rounded text-left"
                                      >
                                        <span>{q}</span>
                                        {quality === q && <Check size={12} className="text-saffron" />}
                                      </button>
                                    ))}
                                  </>
                                )}

                                {settingsActiveTab === "subtitles" && (
                                  <>
                                    <div className="font-bold border-b border-slate-700/60 pb-1.5 flex items-center gap-2">
                                      <button onClick={() => setSettingsActiveTab("main")} className="text-saffron hover:underline">←</button>
                                      <span>Toggle Subtitles</span>
                                    </div>
                                    <button 
                                      onClick={handleSubtitlesToggle}
                                      className="flex items-center justify-between w-full py-2 px-2 hover:bg-slate-800 rounded text-left"
                                    >
                                      <span>On (Hindi Devotional)</span>
                                      {isSubtitlesOn && <Check size={12} className="text-saffron" />}
                                    </button>
                                    <button 
                                      onClick={() => { setIsSubtitlesOn(false); setShowSettingsMenu(false); }}
                                      className="flex items-center justify-between w-full py-2 px-2 hover:bg-slate-800 rounded text-left"
                                    >
                                      <span>Off</span>
                                      {!isSubtitlesOn && <Check size={12} className="text-saffron" />}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <p className="text-white text-sm mb-4">Video is currently unavailable.</p>
                <div className="flex gap-4">
                  <button onClick={() => navigate(-1)} className="bg-slate-850 text-white px-5 py-2.5 rounded-xl text-xs font-bold">
                    Back
                  </button>
                  <button onClick={() => window.location.reload()} className="bg-saffron text-white px-5 py-2.5 rounded-xl text-xs font-bold">
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VIDEO INFO & CONTROLS SECTION */}
        <div className="pb-6 shrink-0">
          <div className="p-5 border-b border-orange-100 dark:border-slate-700">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-[10px] uppercase font-bold text-saffron-dark bg-saffron/10 px-2 py-1 rounded-md">{video.category || 'Spiritual'}</span>
            </div>
            <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white leading-snug">{video.title}</h1>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-200 dark:bg-slate-700 rounded-full overflow-hidden">
                   <SecureImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${video.speaker || 'Swami'}`} alt={video.speaker || "Speaker"} />
                </div>
                <div>
                  <p className="font-bold text-sm text-brown-dark dark:text-white">{video.speaker || 'Swami Ji'}</p>
                  <p className="text-[10px] text-brown-light dark:text-slate-400">{video.views || 0} views</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleLike} 
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${userLikes.includes(video.id) ? 'bg-red-500 text-white' : 'bg-orange-50 dark:bg-slate-800 text-brown-light dark:text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                >
                  <Heart size={18} />
                </button>
                <button 
                  onClick={handleBookmark} 
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${userBookmarks.includes(video.id) ? 'bg-saffron text-white' : 'bg-orange-50 dark:bg-slate-800 text-brown-light dark:text-slate-300 hover:text-saffron-dark'}`}
                >
                  <Bookmark size={18} />
                </button>
                <button onClick={handleShare} className="w-9 h-9 flex items-center justify-center rounded-full bg-orange-50 dark:bg-slate-800 text-brown-light dark:text-slate-300 hover:text-blue-500 transition-colors">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS (Download, Read PDF Notes) */}
          <div className="px-5 py-4 flex gap-3 overflow-x-auto hide-scrollbar">
            <button 
              onClick={handleDownload}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap active:scale-95 transition-colors ${isYouTube ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-500' : userDownloads.includes(video.id) ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}
            >
              {userDownloads.includes(video.id) && !isYouTube ? <Check size={16} /> : <Download size={16} />} 
              {isYouTube ? 'Download Disabled' : userDownloads.includes(video.id) ? 'Downloaded' : 'Download Video'}
            </button>
            {video.pdfUrl && (
              <button 
                onClick={() => navigate(`/adhyayan/pdf/${video.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl font-semibold text-sm whitespace-nowrap active:scale-95 transition-transform"
              >
                <FileText size={16} /> Read PDF Notes
              </button>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="px-5 py-2">
            <div className="bg-orange-50 dark:bg-slate-800 p-4 rounded-2xl">
              <h3 className="font-bold font-sans text-sm text-brown-dark dark:text-white mb-2">Description</h3>
              <p className="text-sm text-brown-light dark:text-slate-300 font-mukta leading-relaxed whitespace-pre-line">
                {video.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PLAYLIST PANEL (Right on Web, Below on Mobile) */}
      <div className="w-full xl:w-[400px] border-t xl:border-t-0 xl:border-l border-orange-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 h-[450px] xl:h-full">
         <div className="p-4 border-b border-orange-100 dark:border-slate-800">
            <h3 className="font-bold font-sans text-lg text-brown-dark dark:text-white leading-tight mb-1">Playlist: {video.categoryName || 'Category'}</h3>
            <div className="flex items-center justify-between">
              <p className="text-xs text-brown-light dark:text-slate-400">
                {currentIndex + 1} / {playlistVideos.length} Videos
              </p>
              
              <div className="flex items-center gap-2">
                <button onClick={() => setIsShuffle(!isShuffle)} className={`p-1.5 rounded-md transition ${isShuffle ? 'bg-saffron text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <Shuffle size={14} />
                </button>
                <button onClick={() => setIsRepeat(!isRepeat)} className={`p-1.5 rounded-md transition ${isRepeat ? 'bg-saffron text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <Repeat size={14} />
                </button>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs text-slate-500 font-medium">Autoplay</span>
                  <button 
                    onClick={() => setAutoPlayNext(!autoPlayNext)} 
                    className={`w-8 h-4 rounded-full relative transition-colors ${autoPlayNext ? 'bg-saffron' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoPlayNext ? 'translate-x-4' : ''}`}></span>
                  </button>
                </div>
              </div>
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto p-2">
            {playlistVideos.map((item: any) => {
              const isPlayingItem = item.id === video.id;
              return (
                <div 
                  key={item.id}
                  onClick={() => navigate(`/adhyayan/video/${item.id}`)}
                  className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-colors ${isPlayingItem ? 'bg-orange-50 dark:bg-slate-800 border border-orange-200 dark:border-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <div className="relative w-32 aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden shrink-0">
                    <SecureImage src={item.thumbnailUrl || getVideoThumbnail(item)} className="w-full h-full object-cover" alt={item.title} />
                    {isPlayingItem && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                          <Play className="text-white fill-white ml-0.5" size={12} />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-mono">
                      {item.duration || '0:00'}
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-center flex-1">
                    <h4 className={`font-bold text-sm line-clamp-2 ${isPlayingItem ? 'text-saffron-dark' : 'text-brown-dark dark:text-slate-200'}`}>{item.title}</h4>
                    <p className="text-[10px] text-brown-light dark:text-slate-400 mt-1">{item.speaker || 'Swami Ji'}</p>
                  </div>
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
};
