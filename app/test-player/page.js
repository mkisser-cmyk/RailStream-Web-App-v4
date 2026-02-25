'use client';

import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

export default function TestPlayerPage() {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [status, setStatus] = useState('Initializing...');
  const [hlsUrl, setHlsUrl] = useState(null);
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

    let loadedCount = 0;

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

  // Fetch playback URL
  useEffect(() => {
    async function fetchPlayback() {
      try {
        setStatus('Fetching camera catalog...');
        const catalogRes = await fetch('/api/cameras/catalog');
        const cameras = await catalogRes.json();
        
        const onlineCamera = cameras.find(c => c.status === 'online');
        if (!onlineCamera) {
          setStatus('No online camera found');
          return;
        }

        setStatus(`Found camera: ${onlineCamera.name}`);
        
        const playbackRes = await fetch('/api/playback/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ camera_id: onlineCamera._id }),
        });
        
        const playback = await playbackRes.json();
        
        if (playback.hls_url) {
          setStatus(`Got HLS URL - waiting for scripts...`);
          setHlsUrl(playback.hls_url);
        } else {
          setStatus(`No HLS URL returned`);
        }
      } catch (err) {
        setStatus(`Fetch error: ${err.message}`);
      }
    }
    
    fetchPlayback();
  }, []);

  // Initialize player when both scripts and URL are ready
  useEffect(() => {
    if (!scriptsLoaded || !hlsUrl || !videoRef.current) return;

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
          },
        });

        playerRef.current = player;

        // Try Nuevo
        if (player.nuevo) {
          try {
            player.nuevo({ contextMenu: false, shareMenu: false });
            setStatus('Nuevo initialized!');
          } catch(e) {
            setStatus('Nuevo error: ' + e.message);
          }
        }

        setStatus('Setting source...');
        player.src({
          type: 'application/x-mpegURL',
          src: hlsUrl,
        });

        player.on('loadstart', () => setStatus('Load started...'));
        player.on('loadedmetadata', () => setStatus('Metadata loaded!'));
        player.on('canplay', () => setStatus('Can play!'));
        player.on('playing', () => setStatus('✅ PLAYING!'));
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
  }, [scriptsLoaded, hlsUrl]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4 text-orange-500">Video Player Test Page (Nuevo + hlsjs)</h1>
      
      <div className="mb-4 p-4 bg-gray-900 rounded">
        <p className="font-mono text-sm">Status: {status}</p>
        {hlsUrl && <p className="font-mono text-xs text-gray-400 mt-2 break-all">URL: {hlsUrl}</p>}
      </div>

      <div className="aspect-video bg-gray-800 rounded overflow-hidden" style={{ maxWidth: '800px' }}>
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
          <li>• Video.js + Nuevo + hlsjs.js from /public/vendor/nuevo/</li>
          <li>• Scripts loaded: {scriptsLoaded ? '✅' : '⏳'}</li>
          <li>• HLS URL: {hlsUrl ? '✅' : '⏳'}</li>
        </ul>
      </div>
    </div>
  );
}
