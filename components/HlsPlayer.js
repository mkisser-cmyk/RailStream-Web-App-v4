'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

/**
 * HlsPlayer — A fresh, universal HLS player for RailStream
 * 
 * Uses HLS.js for Chrome/Firefox/Edge, native HLS for Safari.
 * Custom dark UI with orange (#ff7a00) accents.
 * Works on desktop, tablet, and mobile.
 */

// Build the full HLS stream URL from API response
export function buildStreamUrl(edgeBase, wmsAuth, dvrOffset = 0, windowSec = 7200) {
  if (!edgeBase) return null;
  // Ensure edge_base ends with /
  const base = edgeBase.endsWith('/') ? edgeBase : edgeBase + '/';
  const playlist = `playlist_dvr_timeshift-${dvrOffset}-${windowSec}.m3u8`;
  const auth = wmsAuth ? `?wmsAuthSign=${encodeURIComponent(wmsAuth)}` : '';
  return `${base}${playlist}${auth}`;
}

export default function HlsPlayer({
  src,
  autoPlay = true,
  muted = true,
  controls = true,
  onPlaying,
  onError,
  className = '',
  poster = null,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const retryTimerRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(muted ? 0 : 0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 3;

  // Cleanup function
  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  // Initialize player
  useEffect(() => {
    if (!src || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    const initPlayer = () => {
      // Check if HLS.js is supported (Chrome, Firefox, Edge, etc.)
      if (Hls.isSupported()) {
        destroyHls();

        const hls = new Hls({
          maxBufferLength: 20,
          maxMaxBufferLength: 60,
          backBufferLength: 30,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 6,
          enableWorker: true,
          lowLatencyMode: false,
          startLevel: -1, // Auto quality selection
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 15000,
          levelLoadingTimeOut: 15000,
        });

        hlsRef.current = hls;

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(src);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          if (autoPlay) {
            video.play().catch(() => {
              // Autoplay blocked — show play button
              setIsPlaying(false);
            });
          }
        });

        hls.on(Hls.Events.FRAG_LOADED, () => {
          // Reset retry count on successful fragment load
          setRetryCount(0);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.warn('HLS error:', data.type, data.details);

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Fatal network error:', data.details);
                setRetryCount(prev => {
                  const next = prev + 1;
                  if (next <= MAX_RETRIES) {
                    retryTimerRef.current = setTimeout(() => {
                      hls.startLoad();
                    }, 2000 * next);
                  } else {
                    setError('Stream unavailable. Please try again.');
                    setIsLoading(false);
                    if (onError) onError('Network error');
                  }
                  return next;
                });
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Fatal media error, recovering...');
                hls.recoverMediaError();
                break;
              default:
                setError('Unable to play stream');
                setIsLoading(false);
                destroyHls();
                if (onError) onError('Fatal error');
                break;
            }
          }
        });

        hls.attachMedia(video);
      }
      // Safari — native HLS support
      else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          if (autoPlay) {
            video.play().catch(() => setIsPlaying(false));
          }
        });
        video.addEventListener('error', () => {
          setError('Stream unavailable');
          setIsLoading(false);
          if (onError) onError('Playback error');
        });
      }
      else {
        setError('Your browser does not support HLS video playback.');
        setIsLoading(false);
      }
    };

    initPlayer();

    return () => {
      destroyHls();
    };
  }, [src, autoPlay, destroyHls, onError]);

  // Sync muted prop
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
      setIsMuted(muted);
    }
  }, [muted]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      if (onPlaying) onPlaying();
    };
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('playing', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('playing', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [onPlaying]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying && controls) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying, controls]);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying, resetControlsTimer]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Control handlers
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    if (!video.muted && volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    video.muted = val === 0;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      (container.requestFullscreen || container.webkitRequestFullscreen)?.call(container).catch(() => {});
    }
  };

  const handleRetry = () => {
    if (!src || !videoRef.current) return;
    setError(null);
    setIsLoading(true);
    setRetryCount(0);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Re-trigger by changing internal state — the src useEffect will handle it
    const video = videoRef.current;
    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 20,
        maxMaxBufferLength: 60,
        backBufferLength: 30,
        liveSyncDurationCount: 3,
        enableWorker: true,
        startLevel: -1,
      });
      hlsRef.current = hls;
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          setError('Stream unavailable');
          setIsLoading(false);
        }
      });
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.load();
      video.play().catch(() => {});
    }
  };

  // Jump to live edge
  const jumpToLive = () => {
    const video = videoRef.current;
    if (!video) return;
    if (hlsRef.current) {
      const hls = hlsRef.current;
      if (hls.liveSyncPosition) {
        video.currentTime = hls.liveSyncPosition;
      }
    }
    video.play().catch(() => {});
  };

  return (
    <div
      ref={containerRef}
      className={`rs-player relative w-full h-full bg-black overflow-hidden group ${className}`}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onClick={(e) => {
        // Only toggle play on direct container/video click, not on controls
        if (e.target === videoRef.current || e.target.classList.contains('rs-player-overlay')) {
          togglePlay();
        }
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted={isMuted}
        poster={poster || undefined}
        style={{ backgroundColor: '#000' }}
      />

      {/* Loading Overlay */}
      {isLoading && !error && (
        <div className="rs-player-overlay absolute inset-0 flex items-center justify-center bg-black/60 z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-[#ff7a00]/30 rounded-full" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-[#ff7a00] border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-white/70 text-sm font-medium">Connecting to stream...</span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
          <div className="text-center p-6 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-white font-semibold text-lg mb-1">Stream Unavailable</p>
            <p className="text-white/50 text-sm mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-2.5 bg-[#ff7a00] hover:bg-[#ff8c20] text-white font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Big Play Button (when paused and not loading/error) */}
      {!isPlaying && !isLoading && !error && (
        <div className="rs-player-overlay absolute inset-0 flex items-center justify-center z-10 cursor-pointer">
          <button
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-[#ff7a00]/90 hover:bg-[#ff7a00] flex items-center justify-center transition-all transform hover:scale-110 shadow-2xl shadow-orange-500/30"
            aria-label="Play"
          >
            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      )}

      {/* Controls Bar */}
      {controls && !error && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

          <div className="relative px-4 py-3 flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Live indicator */}
            <button
              onClick={jumpToLive}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-colors"
              aria-label="Jump to live"
            >
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={toggleMute}
                className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/vol:w-20 transition-all duration-200 h-1 appearance-none bg-white/30 rounded-full cursor-pointer overflow-hidden
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ff7a00] [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#ff7a00] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                aria-label="Volume"
              />
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Minimal background player for hero sections
export function BackgroundHlsPlayer({ src, className = '' }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    if (!src || !videoRef.current) return;
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 10,
        backBufferLength: 10,
        liveSyncDurationCount: 2,
        enableWorker: true,
        startLevel: 0, // Start with lowest quality for background
      });
      hlsRef.current = hls;
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          // Silently retry for background video
          setTimeout(() => {
            hls.destroy();
            hlsRef.current = null;
          }, 5000);
        }
      });
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => video.play().catch(() => {}));
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className={`w-full h-full object-cover ${className}`}
      muted
      playsInline
      loop
      autoPlay
      style={{ backgroundColor: '#000' }}
    />
  );
}
