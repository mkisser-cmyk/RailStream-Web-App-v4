'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * RailStreamPlayer - Video.js based player component
 * 
 * Adapted from the RailStream player source (rs-media.js v3.4.0)
 * Uses Video.js with HLS support for live streaming and DVR
 */

// Stream quality presets based on view mode
const QUALITY_PRESETS = {
  single: { suffix: '', maxBitrate: 8000000 },   // Full quality 1080p
  dual: { suffix: '_720', maxBitrate: 4000000 }, // 720p for dual view
  quad: { suffix: '_540', maxBitrate: 2500000 }, // 540p for quad view
  nine: { suffix: '_540', maxBitrate: 2000000 }, // 540p for 9-view
};

export default function RailStreamPlayer({
  cameraId,
  hlsUrl,
  authToken,
  edgeBase,
  thumbBase,
  viewMode = 'single',
  autoPlay = true,
  muted = true,
  controls = true,
  onError,
  onPlaying,
  className = '',
  dvrEnabled = false,
  dvrDays = 7,
}) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentToken, setCurrentToken] = useState(authToken);

  // Get stream URL with quality suffix based on view mode
  const getStreamUrl = useCallback((baseUrl, mode) => {
    if (!baseUrl) return null;
    
    // For now, use the provided HLS URL directly
    // In the future, we can modify the URL to include quality suffix
    const quality = QUALITY_PRESETS[mode] || QUALITY_PRESETS.single;
    
    // Add token if available
    let url = baseUrl;
    if (currentToken && !url.includes('wmsAuthSign')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}wmsAuthSign=${encodeURIComponent(currentToken)}`;
    }
    
    return url;
  }, [currentToken]);

  // Initialize Video.js player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    let videojs;
    let player;

    const initPlayer = async () => {
      try {
        // Dynamic import of video.js
        const vjsModule = await import('video.js');
        videojs = vjsModule.default;

        // Destroy previous instance if exists
        if (playerRef.current) {
          try {
            playerRef.current.dispose();
          } catch (e) {
            console.log('Error disposing player:', e);
          }
          playerRef.current = null;
        }

        setIsLoading(true);
        setError(null);

        // Create player with configuration similar to rs-media.js
        player = videojs(video, {
          controls: controls,
          autoplay: autoPlay,
          muted: muted,
          preload: 'auto',
          fluid: false,
          responsive: true,
          playsinline: true,
          liveui: true,
          playbackRates: [0.5, 1, 1.5, 2],
          html5: {
            vhs: {
              overrideNative: true,
              enableLowInitialPlaylist: true,
              limitRenditionByPlayerDimensions: true,
              maxInitialBitrate: QUALITY_PRESETS[viewMode]?.maxBitrate || 7500000,
              bandwidthVariance: 1.4,
            },
            nativeAudioTracks: false,
            nativeVideoTracks: false,
            nativeTextTracks: false,
          },
        });

        playerRef.current = player;

        // Set source
        const streamUrl = getStreamUrl(hlsUrl, viewMode);
        console.log('Loading stream:', streamUrl);
        
        player.src({
          type: 'application/x-mpegURL',
          src: streamUrl,
        });

        // Event handlers
        player.on('loadedmetadata', () => {
          console.log('Video metadata loaded');
          setIsLoading(false);
        });

        player.on('playing', () => {
          console.log('Video playing');
          setIsPlaying(true);
          setIsLoading(false);
          if (onPlaying) onPlaying();
        });

        player.on('waiting', () => {
          console.log('Video buffering...');
        });

        player.on('error', (e) => {
          const err = player.error();
          console.error('Video.js error:', err);
          
          // Try to recover from certain errors
          if (err && err.code === 4) {
            // Media error - try to reload
            console.log('Attempting to recover from media error...');
            setTimeout(() => {
              if (playerRef.current) {
                playerRef.current.src({
                  type: 'application/x-mpegURL',
                  src: getStreamUrl(hlsUrl, viewMode),
                });
                playerRef.current.play();
              }
            }, 2000);
          } else {
            setError(err?.message || 'Playback error');
            if (onError) onError(err?.message || 'Playback error');
          }
        });

        player.on('ended', () => {
          console.log('Stream ended');
        });

        // Ready callback
        player.ready(() => {
          console.log('Player ready');
          
          // Start playback
          if (autoPlay) {
            player.play().catch((err) => {
              console.log('Autoplay blocked:', err);
              // Autoplay was prevented, user needs to click
            });
          }
        });

      } catch (err) {
        console.error('Failed to initialize Video.js:', err);
        setError('Failed to initialize player');
        setIsLoading(false);
        if (onError) onError('Failed to initialize player');
      }
    };

    initPlayer();

    // Cleanup
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (e) {
          console.log('Error disposing player:', e);
        }
        playerRef.current = null;
      }
    };
  }, [hlsUrl, controls, autoPlay, viewMode]);

  // Handle muted state changes
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.muted(muted);
    }
  }, [muted]);

  // Handle view mode changes (quality switching)
  useEffect(() => {
    if (playerRef.current && hlsUrl) {
      const newUrl = getStreamUrl(hlsUrl, viewMode);
      const currentSrc = playerRef.current.currentSrc();
      
      // Only reload if URL actually changed
      if (newUrl !== currentSrc) {
        const currentTime = playerRef.current.currentTime();
        const wasPaused = playerRef.current.paused();
        
        playerRef.current.src({
          type: 'application/x-mpegURL',
          src: newUrl,
        });
        
        playerRef.current.one('loadedmetadata', () => {
          if (currentTime > 0) {
            playerRef.current.currentTime(currentTime);
          }
          if (!wasPaused) {
            playerRef.current.play();
          }
        });
      }
    }
  }, [viewMode, hlsUrl, getStreamUrl]);

  return (
    <div className={`railstream-player relative w-full h-full bg-black ${className}`}>
      {/* Video Element */}
      <div data-vjs-player className="w-full h-full">
        <video
          ref={videoRef}
          className="video-js vjs-default-skin vjs-fill w-full h-full"
          playsInline
          crossOrigin="anonymous"
        />
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#ff7a00] border-t-transparent rounded-full animate-spin" />
            <span className="text-white/70 text-sm">Loading stream...</span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">Stream Unavailable</p>
            <p className="text-white/60 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified player for background video (no controls, minimal features)
export function BackgroundVideoPlayer({ hlsUrl, className = '' }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    const initPlayer = async () => {
      try {
        const vjsModule = await import('video.js');
        const videojs = vjsModule.default;

        if (playerRef.current) {
          playerRef.current.dispose();
          playerRef.current = null;
        }

        const player = videojs(video, {
          controls: false,
          autoplay: true,
          muted: true,
          loop: true,
          preload: 'auto',
          fluid: false,
          responsive: false,
          playsinline: true,
          html5: {
            vhs: {
              overrideNative: true,
              enableLowInitialPlaylist: true,
            },
            nativeAudioTracks: false,
            nativeVideoTracks: false,
            nativeTextTracks: false,
          },
        });

        playerRef.current = player;

        player.src({
          type: 'application/x-mpegURL',
          src: hlsUrl,
        });

        player.ready(() => {
          player.play().catch(() => {});
        });

      } catch (err) {
        console.error('Background player error:', err);
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [hlsUrl]);

  return (
    <div data-vjs-player className={`w-full h-full ${className}`}>
      <video
        ref={videoRef}
        className="video-js w-full h-full object-cover"
        muted
        playsInline
        loop
      />
    </div>
  );
}
