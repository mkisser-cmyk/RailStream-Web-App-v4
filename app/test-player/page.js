'use client';

import { useEffect, useRef, useState } from 'react';

export default function TestPlayerPage() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Initializing...');
  const [hlsUrl, setHlsUrl] = useState(null);

  // First, fetch a playback URL
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

        setStatus(`Found camera: ${onlineCamera.name}, authorizing playback...`);
        
        const playbackRes = await fetch('/api/playback/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ camera_id: onlineCamera._id }),
        });
        
        const playback = await playbackRes.json();
        
        if (playback.hls_url) {
          setStatus(`Got HLS URL: ${playback.hls_url}`);
          setHlsUrl(playback.hls_url);
        } else {
          setStatus(`No HLS URL returned: ${JSON.stringify(playback)}`);
        }
      } catch (err) {
        setStatus(`Error: ${err.message}`);
      }
    }
    
    fetchPlayback();
  }, []);

  // Initialize Video.js when we have the URL
  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;

    let player = null;

    async function initPlayer() {
      try {
        setStatus('Loading Video.js...');
        const vjsModule = await import('video.js');
        const videojs = vjsModule.default;

        setStatus('Creating player...');
        
        player = videojs(videoRef.current, {
          controls: true,
          autoplay: true,
          muted: true,
          preload: 'auto',
          liveui: true,
          html5: {
            vhs: {
              overrideNative: true,
              handleManifestRedirects: true,
            },
            nativeAudioTracks: false,
            nativeVideoTracks: false,
          },
        });

        setStatus('Setting source...');
        player.src({
          type: 'application/x-mpegURL',
          src: hlsUrl,
        });

        player.on('loadstart', () => setStatus('Load started...'));
        player.on('loadedmetadata', () => setStatus('Metadata loaded!'));
        player.on('canplay', () => setStatus('Can play!'));
        player.on('playing', () => setStatus('PLAYING!'));
        player.on('error', () => {
          const err = player.error();
          setStatus(`Error: ${err?.code} - ${err?.message}`);
        });

        player.ready(() => {
          setStatus('Player ready, attempting play...');
          player.play().catch(e => setStatus(`Play failed: ${e.message}`));
        });

      } catch (err) {
        setStatus(`Init error: ${err.message}`);
      }
    }

    initPlayer();

    return () => {
      if (player) {
        try { player.dispose(); } catch (e) {}
      }
    };
  }, [hlsUrl]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4 text-orange-500">Video Player Test Page</h1>
      
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
          <li>• Video.js loaded via dynamic import</li>
          <li>• Using VHS (Video.js HTTP Streaming) for HLS</li>
          <li>• Native tracks disabled for browser compatibility</li>
        </ul>
      </div>
    </div>
  );
}
