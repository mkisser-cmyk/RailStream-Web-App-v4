'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

/**
 * RailStreamPlayer - Video.js based player using Nuevo plugin with hlsjs
 * 
 * This player uses the same Video.js + Nuevo + hlsjs.js stack as the production
 * player.railstream.net implementation.
 */

// Stream quality presets based on view mode
const QUALITY_PRESETS = {
  single: { suffix: '', maxBitrate: 8000000 },   // Full quality 1080p
  dual: { suffix: '_720', maxBitrate: 4000000 }, // 720p for dual view
  quad: { suffix: '_540', maxBitrate: 2500000 }, // 540p for quad view
  nine: { suffix: '_540', maxBitrate: 2000000 }, // 540p for 9-view
};

// Track if scripts are loaded globally
let scriptsLoaded = false;
let scriptLoadPromise = null;

function loadScripts() {
  if (scriptsLoaded) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const scripts = [
      '/vendor/nuevo/video.min.js',
      '/vendor/nuevo/nuevo.min.js',
      '/vendor/nuevo/plugins/hlsjs.js',
    ];

    let loaded = 0;
    
    scripts.forEach((src, index) => {
      // Check if already loaded
      if (document.querySelector(`script[src="${src}"]`)) {
        loaded++;
        if (loaded === scripts.length) {
          scriptsLoaded = true;
          resolve();
        }
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      
      if (index === 0) {
        script.onload = () => {
          loaded++;
          // Load others after video.js
          loadRemainingScripts(scripts.slice(1), () => {
            scriptsLoaded = true;
            resolve();
          }, reject);
        };
        script.onerror = reject;
        document.body.appendChild(script);
      }
    });
  });

  return scriptLoadPromise;
}

function loadRemainingScripts(scripts, onComplete, onError) {
  let loaded = 0;
  scripts.forEach(src => {
    if (document.querySelector(`script[src="${src}"]`)) {
      loaded++;
      if (loaded === scripts.length) onComplete();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => {
      loaded++;
      if (loaded === scripts.length) onComplete();
    };
    script.onerror = onError;
    document.body.appendChild(script);
  });
}

export default function RailStreamPlayer({
  cameraId,
  hlsUrl,
  viewMode = 'single',
  autoPlay = true,
  muted = true,
  controls = true,
  onError,
  onPlaying,
  className = '',
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scriptsReady, setScriptsReady] = useState(false);

  // Load scripts once on mount
  useEffect(() => {
    loadScripts()
      .then(() => {
        console.log('Video.js scripts loaded');
        setScriptsReady(true);
      })
      .catch(err => {
        console.error('Failed to load scripts:', err);
        setError('Failed to load player scripts');
        setIsLoading(false);
      });
  }, []);

  // Initialize player when scripts are ready
  useEffect(() => {
    if (!scriptsReady || !hlsUrl || !videoRef.current) return;

    let player = null;
    let isMounted = true;

    const initPlayer = () => {
      try {
        // Access videojs from window (loaded via script tag)
        const videojs = window.videojs;
        if (!videojs) {
          console.error('Video.js not found on window');
          setError('Player library not loaded');
          setIsLoading(false);
          return;
        }

        // Dispose previous instance
        if (playerRef.current) {
          try {
            playerRef.current.dispose();
          } catch (e) {
            console.log('Dispose error:', e);
          }
          playerRef.current = null;
        }

        setIsLoading(true);
        setError(null);

        // Create player with configuration matching rs-media.js
        player = videojs(videoRef.current, {
          controls: controls,
          autoplay: autoPlay,
          muted: muted,
          preload: 'auto',
          playsinline: true,
          liveui: true,
          html5: {
            hlsjsConfig: {
              maxBufferLength: 15,
              backBufferLength: 30,
              liveSyncDurationCount: 3,
              enableWorker: true,
            },
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

        if (!isMounted) {
          player.dispose();
          return;
        }

        playerRef.current = player;

        // Initialize Nuevo plugin if available
        if (player.nuevo) {
          try {
            player.nuevo({
              contextMenu: false,
              resOnly: true,
              shareMenu: false,
              zoomMenu: false,
            });
          } catch (e) {
            console.log('Nuevo init:', e);
          }
        }

        // Set source
        console.log('Setting source:', hlsUrl);
        player.src({
          type: 'application/x-mpegURL',
          src: hlsUrl,
        });

        // Event handlers
        player.on('loadedmetadata', () => {
          console.log('Video metadata loaded for', cameraId);
          setIsLoading(false);
        });

        player.on('playing', () => {
          console.log('Video playing:', cameraId);
          setIsLoading(false);
          if (onPlaying) onPlaying();
        });

        player.on('waiting', () => {
          console.log('Video buffering:', cameraId);
        });

        player.on('error', () => {
          const err = player.error();
          console.error('Video.js error:', err);
          
          if (err && err.code === 4) {
            // Media error - try to reload
            console.log('Attempting recovery for', cameraId);
            setTimeout(() => {
              if (playerRef.current && isMounted) {
                playerRef.current.src({
                  type: 'application/x-mpegURL',
                  src: hlsUrl,
                });
                playerRef.current.play().catch(() => {});
              }
            }, 3000);
          } else {
            setError(err?.message || 'Playback error');
            setIsLoading(false);
            if (onError) onError(err?.message);
          }
        });

        // Ready callback
        player.ready(() => {
          console.log('Player ready:', cameraId);
          if (autoPlay && isMounted) {
            player.play().catch((err) => {
              console.log('Autoplay prevented:', err.message);
            });
          }
        });

      } catch (err) {
        console.error('Failed to initialize player:', err);
        if (isMounted) {
          setError('Failed to initialize player');
          setIsLoading(false);
          if (onError) onError('Failed to initialize player');
        }
      }
    };

    // Small delay for DOM stability
    const timeoutId = setTimeout(initPlayer, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (e) {
          console.log('Cleanup dispose error:', e);
        }
        playerRef.current = null;
      }
    };
  }, [scriptsReady, hlsUrl, controls, autoPlay]);

  // Handle muted state changes
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.muted(muted);
    }
  }, [muted]);

  return (
    <div ref={containerRef} className={`railstream-player relative w-full h-full bg-black ${className}`}>
      {/* Video Element */}
      <div data-vjs-player className="w-full h-full">
        <video
          ref={videoRef}
          className="video-js vjs-default-skin vjs-big-play-centered vjs-fill"
          playsInline
          crossOrigin="anonymous"
        />
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#ff7a00] border-t-transparent rounded-full animate-spin" />
            <span className="text-white/70 text-sm">Loading stream...</span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && !isLoading && (
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

// Background video player (muted, no controls, for hero sections)
export function BackgroundVideoPlayer({ hlsUrl, className = '' }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [scriptsReady, setScriptsReady] = useState(false);

  // Load scripts once on mount
  useEffect(() => {
    loadScripts()
      .then(() => setScriptsReady(true))
      .catch(err => console.error('Scripts failed:', err));
  }, []);

  useEffect(() => {
    if (!scriptsReady || !hlsUrl || !videoRef.current) return;

    let player = null;
    let isMounted = true;

    const initPlayer = () => {
      try {
        const videojs = window.videojs;
        if (!videojs) return;

        if (playerRef.current) {
          try { playerRef.current.dispose(); } catch (e) {}
          playerRef.current = null;
        }

        player = videojs(videoRef.current, {
          controls: false,
          autoplay: true,
          muted: true,
          loop: true,
          preload: 'auto',
          playsinline: true,
          html5: {
            hlsjsConfig: {
              maxBufferLength: 15,
              backBufferLength: 30,
              liveSyncDurationCount: 3,
              enableWorker: true,
            },
            vhs: {
              overrideNative: true,
              enableLowInitialPlaylist: true,
            },
            nativeAudioTracks: false,
            nativeVideoTracks: false,
            nativeTextTracks: false,
          },
        });

        if (!isMounted) {
          player.dispose();
          return;
        }

        playerRef.current = player;

        player.src({
          type: 'application/x-mpegURL',
          src: hlsUrl,
        });

        player.ready(() => {
          player.play().catch(() => {});
        });

        player.on('error', () => {
          console.log('Background video error, retrying...');
          setTimeout(() => {
            if (playerRef.current && isMounted) {
              playerRef.current.src({
                type: 'application/x-mpegURL',
                src: hlsUrl,
              });
              playerRef.current.play().catch(() => {});
            }
          }, 5000);
        });

      } catch (err) {
        console.error('Background player error:', err);
      }
    };

    const timeoutId = setTimeout(initPlayer, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (playerRef.current) {
        try { playerRef.current.dispose(); } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [scriptsReady, hlsUrl]);

  return (
    <div ref={containerRef} data-vjs-player className={`w-full h-full ${className}`}>
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
