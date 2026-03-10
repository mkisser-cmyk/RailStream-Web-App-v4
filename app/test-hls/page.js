'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function TestPlayerPage() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [status, setStatus] = useState('Initializing...');
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    console.log(msg);
    setLogs(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testStream = async () => {
    setStatus('Fetching stream URL...');
    addLog('Calling /api/playback/authorize...');

    try {
      const res = await fetch('/api/playback/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_id: '699894a055761e18195294e3', // Atlanta
          device_id: `web-test-${Date.now()}`,
          platform: 'web',
        }),
      });
      const data = await res.json();
      addLog(`API response: ok=${data.ok}, hls_url=${data.hls_url}`);

      if (!data.ok || !data.hls_url) {
        setStatus('API returned no stream URL');
        return;
      }

      const hlsUrl = data.hls_url;
      addLog(`HLS.isSupported: ${Hls.isSupported()}`);

      // Check codec support
      const codecs = [
        'video/mp4; codecs="avc1.640028"',
        'video/mp4; codecs="avc1.640028,mp4a.40.2"',
        'video/mp4; codecs="mp4a.40.2"',
      ];
      codecs.forEach(c => {
        const supported = typeof MediaSource !== 'undefined' ? MediaSource.isTypeSupported(c) : 'N/A';
        addLog(`Codec ${c}: ${supported}`);
      });

      if (Hls.isSupported()) {
        addLog('Creating HLS.js instance...');
        
        if (hlsRef.current) hlsRef.current.destroy();
        
        const hls = new Hls({
          debug: false,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          backBufferLength: 30,
          liveSyncDurationCount: 3,
          enableWorker: true,
          lowLatencyMode: false,
          startLevel: -1,
        });
        hlsRef.current = hls;

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          addLog('Media attached, loading source...');
          hls.loadSource(hlsUrl);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          addLog(`Manifest parsed! Levels: ${data.levels?.length}, Audio: ${data.audioTracks?.length}`);
          setStatus('Playing!');
          videoRef.current.play().catch(e => addLog(`Autoplay blocked: ${e.message}`));
        });

        hls.on(Hls.Events.MANIFEST_LOADED, (event, data) => {
          addLog(`Manifest loaded: ${data.levels?.length} levels`);
        });

        hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
          addLog(`Level loaded: ${data.details?.totalduration}s`);
        });

        hls.on(Hls.Events.FRAG_LOADED, () => {
          addLog('Fragment loaded');
          setStatus('Streaming!');
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          addLog(`HLS ERROR: type=${data.type} detail=${data.details} fatal=${data.fatal}`);
          if (data.reason) addLog(`  reason: ${data.reason}`);
          if (data.fatal) {
            setStatus(`Fatal error: ${data.details}`);
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              addLog('Attempting media recovery...');
              hls.recoverMediaError();
            }
          }
        });

        hls.attachMedia(videoRef.current);
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        addLog('Using native HLS (Safari)');
        videoRef.current.src = hlsUrl;
        videoRef.current.play().catch(e => addLog(`Play error: ${e.message}`));
      } else {
        setStatus('Browser does not support HLS');
      }
    } catch (err) {
      addLog(`Error: ${err.message}`);
      setStatus('Error loading stream');
    }
  };

  useEffect(() => {
    testStream();
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#111', color: '#fff', minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>HLS Player Test</h1>
      <p style={{ color: '#ff7a00', fontSize: '18px', marginBottom: '10px' }}>Status: {status}</p>
      
      <div style={{ maxWidth: '800px', marginBottom: '20px' }}>
        <video
          ref={videoRef}
          style={{ width: '100%', backgroundColor: '#000' }}
          playsInline
          muted
          controls
        />
      </div>
      
      <div style={{ 
        backgroundColor: '#222', 
        padding: '15px', 
        borderRadius: '8px', 
        fontFamily: 'monospace', 
        fontSize: '12px',
        maxHeight: '300px',
        overflowY: 'auto',
      }}>
        <h3 style={{ marginBottom: '10px', color: '#ff7a00' }}>Debug Logs:</h3>
        {logs.map((log, i) => (
          <div key={i} style={{ color: log.includes('ERROR') ? '#f44' : '#aaa', marginBottom: '2px' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
