'use client';

import { useEffect, useRef, useState } from 'react';

export default function TestPlayerPage() {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [status, setStatus] = useState('Initializing...');
  const [playbackData, setPlaybackData] = useState(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  // Load CSS
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/vendor/nuevo/nuevo-skin.css';
    document.head.appendChild(link);
  }, []);

  // Load scripts in sequence
  useEffect(() => {
    const scripts = [
      '/vendor/nuevo/video.min.js',
      '/vendor/nuevo/nuevo.min.js',
      '/vendor/nuevo/plugins/hlsjs.js',
    ];

    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    async function loadAllScripts() {
      try {
        setStatus('Loading Video.js...');
        await loadScript(scripts[0]);
        setStatus('Loading Nuevo plugin...');
        await loadScript(scripts[1]);
        setStatus('Loading HLS.js plugin...');
        await loadScript(scripts[2]);
        setStatus('All scripts loaded!');
        setScriptsLoaded(true);
      } catch (err) {
        setStatus(`Script load error: ${err.message}`);
      }
    }

    loadAllScripts();
  }, []);

  // Fetch playback URL using NEW web-authorize endpoint
  useEffect(() => {
    async function fetchPlayback() {
      try {
        setStatus('Fetching camera catalog...');
        const catalogRes = await fetch('/api/cameras/catalog');
        const cameras = await catalogRes.json();
        
        // Find a Fostoria camera (they have web_hls configured)
        const camera = cameras.find(c => c.short_code && c.short_code.includes('FOS')) 
          || cameras.find(c => c.status === 'online');
        
        if (!camera) {
          setStatus('No online camera found');
          return;
        }

        setStatus(`Found camera: ${camera.name} (${camera.short_code || camera._id})`);
        
        // Use the NEW web-authorize endpoint that returns streams.web_hls
        const playbackRes = await fetch('/api/playback/web-authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ camera_id: camera.short_code || camera._id }),
        });
        
        const playback = await playbackRes.json();
        
        if (playback.ok && playback.edge_base) {
          // Build the full HLS URL
          const hlsUrl = `${playback.edge_base}playlist_dvr_timeshift-0-7200.m3u8?wmsAuthSign=${encodeURIComponent(playback.wms_auth)}`;
          setPlaybackData({ ...playback, hlsUrl });
          setStatus(`Ready to play: ${playback.camera_name}`);
        } else {
          setStatus(`Playback error: ${playback.error || 'Unknown error'}`);
        }
      } catch (err) {
        setStatus(`Fetch error: ${err.message}`);
      }
    }
    
    fetchPlayback();
  }, []);

  // Initialize player when both scripts and URL are ready
  useEffect(() => {
    if (!scriptsLoaded || !playbackData?.hlsUrl || !videoRef.current) return;

    let player = null;

    const initPlayer = () => {
      try {
        const videojs = window.videojs;
        if (!videojs) {
          setStatus('ERROR: videojs not on window');
          return;
        }

        setStatus('Creating player instance...');
        
        // Dispose existing
        if (playerRef.current) {
          try { playerRef.current.dispose(); } catch(e) {}
          playerRef.current = null;
        }

        player = videojs(videoRef.current, {
          controls: true,
          autoplay: true,
          muted: true,
          preload: 'auto',
          liveui: true,
          playsinline: true,
          html5: {
            hlsjsConfig: {
              maxBufferLength: 30,
              backBufferLength: 60,
              liveSyncDurationCount: 3,
              enableWorker: true,
              // Handle alternate audio tracks
              audioCodec: undefined,
              // Ignore certain errors
              fragLoadingMaxRetry: 6,
              manifestLoadingMaxRetry: 4,
              // Broader codec support
              enableSoftwareAES: true,
            },
            vhs: {
              overrideNative: true,
              enableLowInitialPlaylist: true,
              limitRenditionByPlayerDimensions: true,
              // Handle alternate audio
              useDevicePixelRatio: true,
              handleManifestRedirects: true,
            },
            nativeAudioTracks: false,
            nativeVideoTracks: false,
            nativeTextTracks: false,
          },
        });

        playerRef.current = player;

        // Try Nuevo
        if (player.nuevo) {
          try {
            player.nuevo({ contextMenu: false, shareMenu: false });
          } catch(e) {
            console.log('Nuevo init:', e);
          }
        }

        setStatus('Setting source...');
        player.src({
          type: 'application/x-mpegURL',
          src: playbackData.hlsUrl,
        });

        player.on('loadstart', () => setStatus('Load started...'));
        player.on('loadedmetadata', () => setStatus('Metadata loaded!'));
        player.on('canplay', () => setStatus('Can play!'));
        player.on('playing', () => setStatus('✅ PLAYING - ' + playbackData.camera_name));
        player.on('error', () => {
          const err = player.error();
          setStatus(`❌ Error: ${err?.code} - ${err?.message}`);
        });

        player.ready(() => {
          setStatus('Player ready, attempting play...');
          player.play().catch(e => setStatus(`Play blocked: ${e.message}`));
        });

      } catch (err) {
        setStatus(`Init error: ${err.message}`);
      }
    };

    // Small delay for DOM
    setTimeout(initPlayer, 200);

    return () => {
      if (playerRef.current) {
        try { playerRef.current.dispose(); } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [scriptsLoaded, playbackData]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4 text-orange-500">RailStream Player Test (Web HLS)</h1>
      
      <div className="mb-4 p-4 bg-gray-900 rounded">
        <p className="font-mono text-sm">Status: {status}</p>
        {playbackData && (
          <div className="mt-2 text-xs text-gray-400">
            <p>Camera: {playbackData.camera_name} - {playbackData.location}</p>
            <p>Edge Base: {playbackData.edge_base}</p>
            <p className="break-all">HLS URL: {playbackData.hlsUrl?.substring(0, 100)}...</p>
          </div>
        )}
      </div>

      <div className="aspect-video bg-gray-800 rounded overflow-hidden" style={{ maxWidth: '900px' }}>
        <div data-vjs-player className="w-full h-full">
          <video
            ref={videoRef}
            className="video-js vjs-default-skin vjs-big-play-centered w-full h-full"
            playsInline
            crossOrigin="anonymous"
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-900 rounded">
        <h2 className="font-bold mb-2">Debug Info:</h2>
        <ul className="text-sm text-gray-400">
          <li>• Using /api/playback/web-authorize endpoint</li>
          <li>• Gets streams.web_hls from admin API</li>
          <li>• Scripts loaded: {scriptsLoaded ? '✅' : '⏳'}</li>
          <li>• Playback data: {playbackData ? '✅' : '⏳'}</li>
        </ul>
      </div>
    </div>
  );
}
