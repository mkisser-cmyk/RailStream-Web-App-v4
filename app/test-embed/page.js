'use client';

import { useEffect, useState, useRef } from 'react';

export default function TestEmbedPage() {
  const [embedData, setEmbedData] = useState(null);
  const [status, setStatus] = useState('Loading...');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const iframeRef = useRef(null);

  // Fetch cameras on mount
  useEffect(() => {
    async function fetchCameras() {
      try {
        const res = await fetch('/api/cameras/catalog');
        const data = await res.json();
        setCameras(data.filter(c => c.status === 'online'));
        
        // Auto-select first Fostoria camera (they have web_hls configured)
        const fosCamera = data.find(c => c.short_code?.includes('FOS'));
        if (fosCamera) {
          setSelectedCamera(fosCamera);
        } else if (data.length > 0) {
          setSelectedCamera(data.find(c => c.status === 'online') || data[0]);
        }
      } catch (err) {
        setStatus(`Error: ${err.message}`);
      }
    }
    fetchCameras();
  }, []);

  // Fetch embed URL when camera is selected
  useEffect(() => {
    if (!selectedCamera) return;

    async function fetchEmbed() {
      setStatus('Getting embed URL...');
      try {
        const res = await fetch('/api/playback/embed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            camera_id: selectedCamera.short_code || selectedCamera._id 
          }),
        });
        
        const data = await res.json();
        if (data.ok) {
          setEmbedData(data);
          setStatus(`Playing: ${data.camera_name} - ${data.location}`);
        } else {
          setStatus(`Error: ${data.error}`);
        }
      } catch (err) {
        setStatus(`Error: ${err.message}`);
      }
    }

    fetchEmbed();
  }, [selectedCamera]);

  // Handle iframe messages
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin !== 'https://railstream.tv') return;
      
      if (e.data?.type === 'rs:height') {
        // Adjust iframe height if requested
        console.log('Player requested height:', e.data.height);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-4 text-orange-500">RailStream Embed Test</h1>
      
      {/* Camera Selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {cameras.slice(0, 10).map(cam => (
          <button
            key={cam._id}
            onClick={() => setSelectedCamera(cam)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              selectedCamera?._id === cam._id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {cam.name.split(',')[0]}
          </button>
        ))}
      </div>
      
      {/* Status */}
      <div className="mb-4 p-3 bg-gray-900 rounded">
        <p className="text-sm">{status}</p>
        {embedData && (
          <p className="text-xs text-gray-500 mt-1 break-all">
            Embed URL: {embedData.embed_url?.substring(0, 80)}...
          </p>
        )}
      </div>

      {/* Player Iframe */}
      <div className="w-full max-w-4xl mx-auto">
        <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
          {embedData?.embed_url ? (
            <iframe
              ref={iframeRef}
              src={embedData.embed_url}
              title="RailStream Player"
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write"
              allowFullScreen
              loading="eager"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-gray-900 rounded max-w-4xl mx-auto">
        <h2 className="font-bold mb-2">How This Works:</h2>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• We generate a signed embed URL (like Joomla does)</li>
          <li>• The iframe loads your production player at railstream.tv</li>
          <li>• All DVR, audio tracks, and controls work natively</li>
          <li>• Token expires in 5 minutes, can refresh as needed</li>
        </ul>
      </div>
    </div>
  );
}
