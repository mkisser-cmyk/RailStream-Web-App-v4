'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Hls from 'hls.js';

/**
 * RailStream HLS Player — Full-featured live streaming player
 * 
 * Features:
 * - HLS.js for Chrome/Firefox/Edge, native for Safari
 * - Audio track switching (No Radio, Radio, Radio Only)
 * - DVR timeline scrubber with rewind + thumbnail preview
 * - Review Ops mode (7-day archive)
 * - Quality level capping for multi-view
 * - Custom dark UI with orange accents
 */

// ── URL Builder ──
export function buildStreamUrl(baseUrl, dvrOffset = 0, windowSec = 7200) {
  if (!baseUrl) return null;
  // Replace the existing timeshift params if present
  const clean = baseUrl.replace(/playlist_dvr_timeshift-\d+-\d+\.m3u8/, '');
  const base = clean.endsWith('/') ? clean : clean + '/';
  return `${base}playlist_dvr_timeshift-${dvrOffset}-${windowSec}.m3u8`;
}

// ── Quality mapping for multi-view ──
const QUALITY_CAP = {
  single: -1,   // No cap — auto (up to 1080p)
  dual: 1,      // Cap at 720p (level index 1)
  quad: 1,      // Cap at 720p
  nine: 2,      // Cap at 540p (level index 2)
  sixteen: 3,   // Cap at 360p (level index 3, lowest)
};

// ── Block sizes for Review Ops ──
const BLOCK_SIZES = [
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
  { label: '1h', seconds: 3600 },
  { label: '2h', seconds: 7200 },
  { label: '4h', seconds: 14400 },
  { label: '8h', seconds: 28800 },
  { label: '12h', seconds: 43200 },
  { label: '16h', seconds: 57600 },
  { label: '24h', seconds: 86400 },
];

// ── Format helpers ──
function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTimeAgo(seconds) {
  if (seconds < 60) return 'Live';
  if (seconds < 3600) return `-${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `-${h}h${m > 0 ? m + 'm' : ''}`;
}

// ── Extract stream name from HLS URL ──
function extractStreamName(hlsUrl) {
  if (!hlsUrl) return null;
  try {
    // Try parsing as URL - handle both absolute and relative URLs
    let pathname = hlsUrl;
    try {
      pathname = new URL(hlsUrl).pathname;
    } catch {
      // hlsUrl might be relative, use it directly
    }
    const parts = pathname.split('/').filter(Boolean);
    // Camera name is the segment before the playlist file (e.g., FOS_CAM01)
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    // Fallback: regex match
    const match = hlsUrl.match(/\/([A-Z]{2,4}_CAM\d{1,2})\//i);
    if (match) return match[1];
  } catch (e) {
    console.warn('[ThumbScrub] extractStreamName error:', e);
  }
  return null;
}

// ── Thumbnail scrub timestamp calculator ──
function calcThumbTimestamp(hoverPct, seekableStart, seekableEnd, streamEndUnixTime) {
  // Map hover percentage to a position in the seekable range
  const seekRange = seekableEnd - seekableStart;
  const posInStream = seekableStart + hoverPct * seekRange;
  // streamEndUnixTime = the wall-clock time corresponding to seekableEnd
  const offsetFromEnd = seekableEnd - posInStream;
  const ts = streamEndUnixTime - Math.floor(offsetFromEnd);
  // Round to nearest 2-second boundary
  return Math.round(ts / 2) * 2;
}

// ── Thumbnail Preview Component — with aggressive caching for fast scrubbing ──
const thumbCacheMap = new Map(); // Persistent cache across renders: timestamp -> src URL

function ThumbnailPreview({ visible, screenX, screenY, timestamp, streamName, timeLabel, viewMode }) {
  const [displaySrc, setDisplaySrc] = useState(null);
  const loadingRef = useRef(null);
  const lastDirRef = useRef(0); // -1 = left, 1 = right
  const lastTsRef = useRef(null);

  useEffect(() => {
    if (!visible || !streamName || !timestamp) return;
    if (timestamp === lastTsRef.current) return;

    // Track scrub direction for prefetching
    if (lastTsRef.current) {
      lastDirRef.current = timestamp > lastTsRef.current ? 1 : -1;
    }
    lastTsRef.current = timestamp;

    // Check client cache first — instant display
    const cacheKey = `${streamName}/${timestamp}`;
    if (thumbCacheMap.has(cacheKey)) {
      setDisplaySrc(thumbCacheMap.get(cacheKey));
      prefetchNearby(streamName, timestamp, lastDirRef.current);
      return;
    }

    // Load the thumbnail
    const src = `/api/thumbnails/scrub?cam=${encodeURIComponent(streamName)}&ts=${timestamp}`;
    
    if (loadingRef.current) {
      loadingRef.current.onload = null;
      loadingRef.current.onerror = null;
    }

    const img = new Image();
    loadingRef.current = img;
    img.onload = () => {
      thumbCacheMap.set(cacheKey, src);
      setDisplaySrc(src);
      // Prefetch nearby thumbnails in scrub direction
      prefetchNearby(streamName, timestamp, lastDirRef.current);
    };
    img.onerror = () => {};
    img.src = src;
  }, [visible, streamName, timestamp]);

  if (!visible) return null;

  // Responsive thumbnail size based on view mode
  const isCompact = viewMode === 'quad' || viewMode === 'nine' || viewMode === 'sixteen';
  const thumbW = isCompact ? 160 : 240;
  const thumbH = isCompact ? 90 : 135;
  const gapAbove = isCompact ? 30 : 50;
  const borderWidth = isCompact ? 2 : 3;
  const labelFontSize = isCompact ? 11 : 13;

  // Clamp horizontal position so the thumbnail never overflows the viewport
  const halfW = thumbW / 2;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const minLeft = halfW + 8; // 8px padding from left edge
  const maxLeft = viewportW - halfW - 8; // 8px padding from right edge
  const clampedX = Math.max(minLeft, Math.min(maxLeft, screenX));

  // Clamp vertical: ensure thumbnail doesn't go above viewport top
  const rawTop = screenY - thumbH - gapAbove;
  const clampedTop = Math.max(8, rawTop);

  return (
    <div style={{
      position: 'fixed',
      left: clampedX,
      top: clampedTop,
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      zIndex: 99999,
      transition: 'left 0.06s linear',
    }}>
      <div style={{
        width: thumbW, height: thumbH, borderRadius: isCompact ? 4 : 6, overflow: 'hidden',
        border: `${borderWidth}px solid #ff7a00`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.7), 0 0 12px rgba(255,122,0,0.3)',
        background: '#000',
      }}>
        {displaySrc ? (
          <img src={displaySrc} alt="Preview" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
            <div style={{ width: isCompact ? 18 : 24, height: isCompact ? 18 : 24, border: '3px solid rgba(255,122,0,0.4)', borderTopColor: '#ff7a00', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        )}
      </div>
      {timeLabel && (
        <div style={{ textAlign: 'center', marginTop: isCompact ? 4 : 6 }}>
          <span style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.9)', color: '#111',
            fontSize: labelFontSize, fontWeight: 700, fontFamily: 'monospace', padding: isCompact ? '2px 7px' : '3px 10px',
            borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}>{timeLabel}</span>
        </div>
      )}
    </div>
  );
}

// Prefetch thumbnails ahead of and behind the cursor
function prefetchNearby(streamName, centerTs, direction) {
  const step = 2; // 2 seconds between thumbnails
  const ahead = direction >= 0 ? [2, 4, 6, 8, 10, 12, 14, 16] : [-2, -4, -6, -8, -10, -12, -14, -16];
  const behind = direction >= 0 ? [-2, -4] : [2, 4];
  const offsets = [...ahead, ...behind];

  for (const offset of offsets) {
    const ts = centerTs + offset;
    const key = `${streamName}/${ts}`;
    if (thumbCacheMap.has(key)) continue; // Already cached
    
    const src = `/api/thumbnails/scrub?cam=${encodeURIComponent(streamName)}&ts=${ts}`;
    const img = new Image();
    img.onload = () => { thumbCacheMap.set(key, src); };
    img.src = src;
  }
}

export default function HlsPlayer({
  src,
  baseStreamUrl = null,
  autoPlay = true,
  muted = true,
  controls = true,
  viewMode = 'single',
  dvrDays = 7,
  cameraName = '',
  cameraLocation = '',
  onPlaying,
  onError,
  onLogSighting,
  initialSeekOffset = 0,
  className = '',
  poster = null,
  openReviewOps = 0,
  hideReviewButton = false,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const seekBarRef = useRef(null);
  const timeUpdateRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(muted ? 0 : 0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Audio tracks
  const [audioTracks, setAudioTracks] = useState([]);
  const [activeAudioTrack, setActiveAudioTrack] = useState(0);
  const [showAudioMenu, setShowAudioMenu] = useState(false);

  // DVR / Timeline
  const [isLive, setIsLive] = useState(true);
  const [seekableStart, setSeekableStart] = useState(0);
  const [seekableEnd, setSeekableEnd] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Thumbnail scrubbing
  const [thumbHover, setThumbHover] = useState(false);
  const [thumbPct, setThumbPct] = useState(0);
  const [thumbScreenX, setThumbScreenX] = useState(0);
  const [thumbScreenY, setThumbScreenY] = useState(0);
  const thumbDebounceRef = useRef(null);
  const [dvrUrlOffset, setDvrUrlOffset] = useState(0); // DVR offset from URL for thumbnail timestamp calc

  // Review Ops
  const [showReviewOps, setShowReviewOps] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewDay, setReviewDay] = useState(0); // 0 = today
  const [reviewHour, setReviewHour] = useState(12);
  const [reviewMinute, setReviewMinute] = useState(0);
  const [reviewAmPm, setReviewAmPm] = useState('PM');
  const [reviewBlock, setReviewBlock] = useState(3600);

  const MAX_RETRIES = 3;

  // External trigger to open Review Ops modal
  useEffect(() => {
    if (openReviewOps > 0) {
      setShowReviewOps(true);
    }
  }, [openReviewOps]);

  // Get stream base URL (without timeshift params) for Review Ops
  const streamBase = useMemo(() => {
    if (baseStreamUrl) return baseStreamUrl;
    if (!src) return null;
    // Extract base from current src
    const match = src.match(/^(.*?)playlist_dvr_timeshift/);
    return match ? match[1] : src.replace(/\/[^/]*$/, '/');
  }, [src, baseStreamUrl]);

  // Generate day options
  const dayOptions = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < dvrDays; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
      days.push({ label: `${dayName} (${dateStr})`, value: i });
    }
    return days;
  }, [dvrDays]);

  // Cleanup
  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  // ── Initialize HLS ──
  const loadSource = useCallback((url) => {
    const video = videoRef.current;
    if (!url || !video) return;

    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    // Extract DVR offset from URL for correct thumbnail timestamps
    // URL format: playlist_dvr_timeshift-{offset}-{window}.m3u8
    const timeshiftMatch = url.match(/playlist_dvr_timeshift-(\d+)-(\d+)/);
    if (timeshiftMatch) {
      const offset = parseInt(timeshiftMatch[1], 10);
      setDvrUrlOffset(offset);
    } else {
      setDvrUrlOffset(0); // Live stream
    }

    if (Hls.isSupported()) {
      destroyHls();

      const qualityCap = QUALITY_CAP[viewMode] ?? -1;

      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        backBufferLength: Infinity,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 99999,
        liveSyncOnStallIncrease: 0,
        enableWorker: true,
        lowLatencyMode: false,
        startLevel: -1,
        autoLevelCapping: qualityCap,
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 15000,
      });

      hlsRef.current = hls;

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(url);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        // Audio tracks
        if (data.audioTracks && data.audioTracks.length > 0) {
          setAudioTracks(data.audioTracks.map((t, i) => ({ id: i, name: t.name || `Track ${i + 1}` })));
        }
        if (autoPlay) {
          video.play().catch(() => setIsPlaying(false));
        }
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        if (data.audioTracks && data.audioTracks.length > 0) {
          setAudioTracks(data.audioTracks.map((t, i) => ({ id: i, name: t.name || `Track ${i + 1}` })));
        }
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
        setActiveAudioTrack(data.id);
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        setRetryCount(0);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setRetryCount(prev => {
                const next = prev + 1;
                if (next <= MAX_RETRIES) {
                  setTimeout(() => hls.startLoad(), 2000 * next);
                } else {
                  setError('Stream unavailable. Please try again.');
                  setIsLoading(false);
                  if (onError) onError('Network error');
                }
                return next;
              });
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setRetryCount(prev => {
                const next = prev + 1;
                if (next <= 2) {
                  hls.recoverMediaError();
                } else {
                  setError('Unable to decode stream.');
                  setIsLoading(false);
                  if (onError) onError('Media error');
                }
                return next;
              });
              break;
            default:
              setError('Unable to play stream');
              setIsLoading(false);
              destroyHls();
              break;
          }
        }
      });

      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        if (autoPlay) video.play().catch(() => setIsPlaying(false));
      }, { once: true });
    } else {
      setError('Your browser does not support HLS playback.');
      setIsLoading(false);
    }
  }, [autoPlay, destroyHls, onError, viewMode]);

  // Load on src change
  useEffect(() => {
    if (src) loadSource(src);
    return () => destroyHls();
  }, [src, loadSource, destroyHls]);

  // Quality cap on viewMode change
  useEffect(() => {
    if (hlsRef.current) {
      const cap = QUALITY_CAP[viewMode] ?? -1;
      hlsRef.current.autoLevelCapping = cap;
    }
  }, [viewMode]);

  // Sync muted prop
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
      setIsMuted(muted);
    }
  }, [muted]);

  // ── Video event listeners ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => { setIsPlaying(true); setIsLoading(false); if (onPlaying) onPlaying(); };
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

  // ── Time update for DVR timeline ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      const ct = video.currentTime || 0;
      setCurrentTime(ct);
      setDuration(video.duration || 0);

      if (video.seekable && video.seekable.length > 0) {
        const start = video.seekable.start(0);
        const end = video.seekable.end(video.seekable.length - 1);
        setSeekableStart(start);
        setSeekableEnd(end);
        // Consider "live" if within 15 seconds of the edge
        setIsLive(end - ct < 15);
      }
    };

    timeUpdateRef.current = setInterval(updateTime, 500);
    return () => clearInterval(timeUpdateRef.current);
  }, []);

  // ── Initial seek from replay link ──
  const initialSeekAppliedRef = useRef(false);
  useEffect(() => {
    if (initialSeekAppliedRef.current || !initialSeekOffset || initialSeekOffset <= 0) return;
    if (seekableEnd <= seekableStart || seekableEnd === 0) return;
    const video = videoRef.current;
    if (!video) return;

    const targetTime = seekableEnd - initialSeekOffset;
    if (targetTime >= seekableStart) {
      video.currentTime = targetTime;
      setIsLive(false);
      initialSeekAppliedRef.current = true;
      console.log(`[HlsPlayer] Applied initial seek: -${initialSeekOffset}s → time ${targetTime.toFixed(1)}`);
    }
  }, [initialSeekOffset, seekableStart, seekableEnd]);

  // ── Auto-hide controls ──
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying && controls) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setShowAudioMenu(false);
      }, 4000);
    }
  }, [isPlaying, controls]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [isPlaying, resetControlsTimer]);

  // Fullscreen listener
  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    document.addEventListener('webkitfullscreenchange', handleFs);
    return () => {
      document.removeEventListener('fullscreenchange', handleFs);
      document.removeEventListener('webkitfullscreenchange', handleFs);
    };
  }, []);

  // ── Control handlers ──
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
    if (!v.muted && volume === 0) { v.volume = 0.5; setVolume(0.5); }
  };

  const handleVolumeChange = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleFullscreen = () => {
    const c = containerRef.current;
    if (!c) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      (c.requestFullscreen || c.webkitRequestFullscreen)?.call(c).catch(() => {});
    }
  };

  const switchAudioTrack = (trackId) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
      setActiveAudioTrack(trackId);
    }
    setShowAudioMenu(false);
  };

  const jumpToLive = () => {
    const v = videoRef.current;
    if (!v) return;
    if (hlsRef.current?.liveSyncPosition) {
      v.currentTime = hlsRef.current.liveSyncPosition;
    } else if (seekableEnd > 0) {
      v.currentTime = seekableEnd - 1;
    }
    v.play().catch(() => {});
    setIsLive(true);
  };

  // ── DVR Seek ──
  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v || !seekBarRef.current) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = seekableStart + pct * (seekableEnd - seekableStart);
    v.currentTime = targetTime;
  };

  // Calculate stream name from src URL for thumbnail lookups
  const streamName = useMemo(() => extractStreamName(src), [src]);

  // ── Thumbnail hover on seek bar ──
  const handleSeekHover = useCallback((e) => {
    if (!seekBarRef.current) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setThumbPct(pct);
    setThumbScreenX(e.clientX);
    setThumbScreenY(rect.top);
    if (!thumbHover) {
      setThumbHover(true);
    }
  }, [thumbHover]);

  const handleSeekHoverEnd = useCallback(() => {
    setThumbHover(false);
  }, []);

  // Compute the wall-clock unix time that corresponds to seekableEnd
  // For live: seekableEnd ≈ now → streamEndUnixTime = Date.now()/1000
  // For historical DVR: URL has playlist_dvr_timeshift-{offset}-{window}
  //   seekableEnd ≈ now - offset (the newest point in the window)
  const streamEndUnixTime = useMemo(() => {
    return Math.floor(Date.now() / 1000) - dvrUrlOffset;
  }, [dvrUrlOffset]);

  // Calculate thumbnail timestamp for current hover position
  const thumbTimestamp = useMemo(() => {
    if (!thumbHover || seekableEnd <= seekableStart) return null;
    return calcThumbTimestamp(thumbPct, seekableStart, seekableEnd, streamEndUnixTime);
  }, [thumbHover, thumbPct, seekableStart, seekableEnd, streamEndUnixTime]);

  // Calculate time label for thumbnail hover
  const thumbTimeLabel = useMemo(() => {
    if (!thumbHover || seekableEnd <= seekableStart) return '';
    const seekRange = seekableEnd - seekableStart;
    const posInStream = seekableStart + thumbPct * seekRange;
    const offsetFromEnd = seekableEnd - posInStream;
    
    // In review mode, show actual time; in live mode, show offset from live
    if (dvrUrlOffset > 0) {
      // Historical DVR window — show actual wall-clock time
      const wallTime = new Date((streamEndUnixTime - Math.floor(offsetFromEnd)) * 1000);
      const h = wallTime.getHours();
      const m = String(wallTime.getMinutes()).padStart(2, '0');
      const s = String(wallTime.getSeconds()).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m}:${s} ${ampm}`;
    }
    
    // Live mode — show offset from live edge
    if (offsetFromEnd < 2) return 'LIVE';
    const mins = Math.floor(offsetFromEnd / 60);
    const secs = Math.floor(offsetFromEnd % 60);
    return `-${String(mins).padStart(1, '0')}:${String(secs).padStart(2, '0')}`;
  }, [thumbHover, thumbPct, seekableStart, seekableEnd, dvrUrlOffset, streamEndUnixTime]);

  // ── Review Ops ──
  const startReviewOps = () => {
    if (!streamBase) return;

    // Calculate offset in seconds from now
    const now = new Date();
    const target = new Date(now);
    target.setDate(target.getDate() - reviewDay);

    let hour24 = reviewHour;
    if (reviewAmPm === 'PM' && reviewHour !== 12) hour24 += 12;
    if (reviewAmPm === 'AM' && reviewHour === 12) hour24 = 0;
    target.setHours(hour24, reviewMinute, 0, 0);

    const offsetMs = now.getTime() - target.getTime();
    if (offsetMs < 0) return; // Can't go to the future

    const offsetSec = Math.floor(offsetMs / 1000);
    const url = buildStreamUrl(streamBase, offsetSec, reviewBlock);

    setIsReviewMode(true);
    setShowReviewOps(false);
    loadSource(url);
  };

  const backToLiveOps = () => {
    setIsReviewMode(false);
    setShowReviewOps(false);
    if (src) loadSource(src);
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    if (isReviewMode && streamBase) {
      startReviewOps();
    } else if (src) {
      loadSource(src);
    }
  };

  // Calculate seek bar position
  const seekRange = seekableEnd - seekableStart;
  const seekProgress = seekRange > 0 ? (currentTime - seekableStart) / seekRange : 0;
  const timeFromLive = seekableEnd - currentTime;

  return (
    <div
      ref={containerRef}
      className={`rs-player relative w-full h-full bg-black group ${className}`}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onClick={(e) => {
        if (e.target === videoRef.current || e.target.classList.contains('rs-overlay')) togglePlay();
      }}
    >
      {/* Video Element */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          crossOrigin="anonymous"
          muted={isMuted}
          poster={poster || undefined}
          style={{ backgroundColor: '#000' }}
        />
      </div>

      {/* Loading Spinner */}
      {isLoading && !error && (
        <div className="rs-overlay absolute inset-0 flex items-center justify-center bg-black/50 z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-[#ff7a00]/30 rounded-full" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-[#ff7a00] border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-white/70 text-sm font-medium">
              {isReviewMode ? 'Loading archive...' : 'Connecting to stream...'}
            </span>
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
            <button onClick={handleRetry} className="px-6 py-2.5 bg-[#ff7a00] hover:bg-[#ff8c20] text-white font-semibold rounded-lg transition-colors">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Big Play Button */}
      {!isPlaying && !isLoading && !error && (
        <div className="rs-overlay absolute inset-0 flex items-center justify-center z-10 cursor-pointer">
          <button onClick={togglePlay} className="w-20 h-20 rounded-full bg-[#ff7a00]/90 hover:bg-[#ff7a00] flex items-center justify-center transition-all transform hover:scale-110 shadow-2xl shadow-orange-500/30" aria-label="Play">
            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </button>
        </div>
      )}

      {/* Review Mode Banner */}
      {isReviewMode && !error && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent py-2 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-yellow-500/90 text-black text-xs font-bold rounded">REVIEW OPS</span>
            <span className="text-white/80 text-sm">{cameraName}</span>
          </div>
          <button onClick={backToLiveOps} className="px-3 py-1 bg-[#ff7a00] text-white text-xs font-bold rounded hover:bg-[#ff8c20] transition-colors">
            Back to Live
          </button>
        </div>
      )}

      {/* ── Controls Bar ── */}
      {controls && !error && (
        <div className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

          {/* DVR Timeline Scrubber */}
          {seekRange > 10 && (
            <div className="relative px-4 pt-2 pb-0" style={{ overflow: 'visible' }}>
              <div
                ref={seekBarRef}
                className="relative h-8 flex items-center cursor-pointer group/seek"
                style={{ overflow: 'visible' }}
                onClick={handleSeek}
                onMouseMove={handleSeekHover}
                onMouseLeave={handleSeekHoverEnd}
              >
                {/* ── Thumbnail Scrub Preview ── */}
                {thumbHover && (
                  <ThumbnailPreview
                    visible={true}
                    screenX={thumbScreenX}
                    screenY={thumbScreenY}
                    timestamp={thumbTimestamp}
                    streamName={streamName}
                    timeLabel={thumbTimeLabel || 'Loading...'}
                    viewMode={viewMode}
                  />
                )}
                {/* Hover position indicator line */}
                {thumbHover && seekBarRef.current && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none z-10"
                    style={{ left: `${thumbPct * 100}%` }}
                  />
                )}
                {/* Track background */}
                <div className="absolute left-0 right-0 h-1 bg-white/20 rounded-full group-hover/seek:h-1.5 transition-all" />
                {/* Buffered / seekable range */}
                <div
                  className="absolute left-0 h-1 bg-white/30 rounded-full group-hover/seek:h-1.5 transition-all"
                  style={{ width: '100%' }}
                />
                {/* Progress */}
                <div
                  className="absolute left-0 h-1 bg-[#ff7a00] rounded-full group-hover/seek:h-1.5 transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, seekProgress * 100))}%` }}
                />
                {/* Thumb */}
                <div
                  className="absolute w-3 h-3 bg-[#ff7a00] rounded-full shadow-lg transform -translate-x-1/2 opacity-0 group-hover/seek:opacity-100 transition-all"
                  style={{ left: `${Math.max(0, Math.min(100, seekProgress * 100))}%` }}
                />
              </div>
              {/* Time labels */}
              <div className="flex justify-between text-xs text-white/80 -mt-0.5 mb-0.5 font-medium">
                <span>{isReviewMode ? formatTime(currentTime - seekableStart) : formatTimeAgo(seekRange)}</span>
                <span>{isLive ? '' : formatTimeAgo(timeFromLive) + ' from live'}</span>
              </div>
            </div>
          )}

          {/* Controls Row */}
          <div className="relative px-4 py-2.5 flex items-center gap-2">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors" aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>

            {/* Rewind 10s */}
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                }
              }}
              className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
              aria-label="Rewind 10 seconds"
              title="Rewind 10 seconds"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12.5 8V4l-5 4 5 4V8c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4.5c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor" stroke="none" />
              </svg>
              <span className="text-xs font-bold">10</span>
            </button>

            {/* Forward 10s */}
            <button
              onClick={() => {
                if (videoRef.current) {
                  const max = videoRef.current.duration || Infinity;
                  videoRef.current.currentTime = Math.min(max, videoRef.current.currentTime + 10);
                }
              }}
              className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
              aria-label="Forward 10 seconds"
              title="Forward 10 seconds"
            >
              <span className="text-xs font-bold">10</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11.5 8V4l5 4-5 4V8c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" fill="currentColor" stroke="none" />
              </svg>
            </button>

            <div className="w-px h-5 bg-white/20 mx-1" />

            {/* Live / Return to Live */}
            {!isReviewMode && (
              <button
                onClick={jumpToLive}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  isLive ? 'bg-red-600 text-white cursor-default' : 'bg-[#ff7a00] text-white hover:bg-[#ff8c20] cursor-pointer'
                }`}
              >
                {isLive ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    LIVE
                  </>
                ) : (
                  <>
                    <span className="text-base leading-none">↩</span>
                    Return to Live
                  </>
                )}
              </button>
            )}

            {/* Review Ops Button */}
            {!isReviewMode && !hideReviewButton && (
              <button
                onClick={() => setShowReviewOps(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                Review Ops
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Audio Track Selector — only shown when multiple tracks available */}
            {audioTracks.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowAudioMenu(!showAudioMenu)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-sm font-medium ${showAudioMenu ? 'bg-[#ff7a00] text-white' : 'bg-white/10 text-white hover:bg-white/15'}`}
                  aria-label="Switch audio track"
                  title="Switch audio track"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                  <span>Audio</span>
                  <svg className={`w-3 h-3 transition-transform ${showAudioMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                </button>
                {/* Audio menu dropdown */}
                {showAudioMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[160px]">
                    <div className="px-3 py-2 border-b border-white/10">
                      <span className="text-[#ff7a00] text-xs font-bold uppercase">Audio Track</span>
                    </div>
                    {audioTracks.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => switchAudioTrack(track.id)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                          activeAudioTrack === track.id
                            ? 'bg-[#ff7a00]/10 text-[#ff7a00]'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {activeAudioTrack === track.id && (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                        )}
                        <span className={activeAudioTrack === track.id ? '' : 'ml-5'}>{track.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Volume — always visible */}
            <div className="flex items-center gap-1.5">
              <button onClick={toggleMute} className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors" aria-label={isMuted ? 'Unmute' : 'Mute'} title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted || volume === 0 ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
              <input
                type="range" min="0" max="1" step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 h-1.5 appearance-none bg-white/30 rounded-full cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ff7a00]
                  [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#ff7a00] [&::-moz-range-thumb]:border-0"
                aria-label="Volume"
              />
            </div>

            {/* Snapshot */}
            <button
              onClick={() => {
                if (!videoRef.current) return;
                try {
                  const video = videoRef.current;
                  const canvas = document.createElement('canvas');
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  // Add watermark
                  ctx.font = 'bold 16px sans-serif';
                  ctx.fillStyle = 'rgba(255, 122, 0, 0.7)';
                  ctx.textAlign = 'right';
                  ctx.fillText('RailStream.net', canvas.width - 12, canvas.height - 12);
                  // Add camera name
                  ctx.textAlign = 'left';
                  ctx.fillText(cameraName || 'RailStream', 12, canvas.height - 12);
                  // Download
                  const link = document.createElement('a');
                  link.download = `railstream-${(cameraName || 'snapshot').replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')}.jpg`;
                  link.href = canvas.toDataURL('image/jpeg', 0.92);
                  link.click();
                } catch (e) {
                  console.error('Snapshot failed:', e);
                }
              }}
              className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
              aria-label="Take snapshot"
              title="Capture snapshot"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </button>

            {/* Log Train Sighting (captures snapshot + opens form) */}
            {onLogSighting && (
              <button
                onClick={() => {
                  if (!videoRef.current) return;
                  try {
                    const video = videoRef.current;
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    ctx.font = 'bold 16px sans-serif';
                    ctx.fillStyle = 'rgba(255, 122, 0, 0.7)';
                    ctx.textAlign = 'right';
                    ctx.fillText('RailStream.net', canvas.width - 12, canvas.height - 12);
                    ctx.textAlign = 'left';
                    ctx.fillText(cameraName || 'RailStream', 12, canvas.height - 12);
                    const imageData = canvas.toDataURL('image/jpeg', 0.92);
                    // Calculate the current time offset from live
                    const v = videoRef.current;
                    let sightingTime = new Date().toISOString();
                    if (v.seekable && v.seekable.length > 0) {
                      const seekEnd = v.seekable.end(v.seekable.length - 1);
                      const offset = seekEnd - v.currentTime;
                      if (offset > 2) {
                        sightingTime = new Date(Date.now() - offset * 1000).toISOString();
                      }
                    }
                    onLogSighting({ imageData, sightingTime, cameraName, cameraLocation });
                  } catch (e) {
                    console.error('Log sighting snapshot failed:', e);
                    onLogSighting({ imageData: null, sightingTime: new Date().toISOString(), cameraName, cameraLocation });
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-[#ff7a00] hover:text-[#ff8c20] transition-colors text-sm font-semibold"
                aria-label="Log train sighting"
                title="Log a train sighting with snapshot"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L17.877 5.5" />
                </svg>
                Log
              </button>
            )}

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors" aria-label="Fullscreen" title="Fullscreen">
              {isFullscreen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Review Ops Modal ── */}
      {showReviewOps && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowReviewOps(false); }}>
          <div className="bg-[#1a1a1a]/95 border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-white text-xl font-bold mb-1">Review Ops Setup</h3>
            <p className="text-white/40 text-sm mb-5">Browse {dvrDays} days of archived footage</p>

            {/* Day Selector */}
            <label className="text-white/60 text-sm font-medium mb-1 block">Select Day</label>
            <select
              value={reviewDay}
              onChange={(e) => setReviewDay(parseInt(e.target.value))}
              className="w-full bg-[#111] border border-white/10 text-white rounded-lg px-3 py-2.5 mb-4 focus:border-[#ff7a00] focus:outline-none"
            >
              {dayOptions.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>

            {/* Time Picker */}
            <label className="text-white/60 text-sm font-medium mb-1 block">Set Time</label>
            <div className="flex gap-2 mb-4">
              <input
                type="number" min={1} max={12} value={reviewHour}
                onChange={(e) => setReviewHour(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                className="w-20 bg-[#111] border border-white/10 text-white text-center rounded-lg px-2 py-2.5 focus:border-[#ff7a00] focus:outline-none"
              />
              <span className="text-white/40 self-center text-xl">:</span>
              <input
                type="number" min={0} max={59} value={reviewMinute.toString().padStart(2, '0')}
                onChange={(e) => setReviewMinute(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-20 bg-[#111] border border-white/10 text-white text-center rounded-lg px-2 py-2.5 focus:border-[#ff7a00] focus:outline-none"
              />
              <div className="flex rounded-lg overflow-hidden border border-white/10">
                <button
                  onClick={() => setReviewAmPm('AM')}
                  className={`px-3 py-2.5 text-sm font-bold transition-colors ${reviewAmPm === 'AM' ? 'bg-[#ff7a00] text-white' : 'bg-[#111] text-white/50 hover:text-white'}`}
                >AM</button>
                <button
                  onClick={() => setReviewAmPm('PM')}
                  className={`px-3 py-2.5 text-sm font-bold transition-colors ${reviewAmPm === 'PM' ? 'bg-[#ff7a00] text-white' : 'bg-[#111] text-white/50 hover:text-white'}`}
                >PM</button>
              </div>
            </div>

            {/* Block Size */}
            <label className="text-white/60 text-sm font-medium mb-2 block">Block Size</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {BLOCK_SIZES.map((b) => (
                <button
                  key={b.seconds}
                  onClick={() => setReviewBlock(b.seconds)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    reviewBlock === b.seconds
                      ? 'bg-[#ff7a00] text-white border-[#ff7a00]'
                      : 'bg-[#111] text-white/50 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <p className="text-white/50 text-xs mb-5">Total Timeline: {dvrDays}d 00h</p>

            {/* Buttons */}
            <div className="flex gap-3">
              {isReviewMode && (
                <button onClick={backToLiveOps} className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 font-medium transition-colors">
                  Back to Live Ops
                </button>
              )}
              <button onClick={() => setShowReviewOps(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 font-medium transition-colors">
                Cancel
              </button>
              <button onClick={startReviewOps} className="flex-1 py-2.5 rounded-lg bg-[#ff7a00] hover:bg-[#ff8c20] text-white font-bold transition-colors">
                Start Review Ops
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Background player for hero sections ──
export function BackgroundHlsPlayer({ src, className = '' }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    if (!src || !videoRef.current) return;
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 10, backBufferLength: 10, liveSyncDurationCount: 2, enableWorker: true, startLevel: 0,
      });
      hlsRef.current = hls;
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) setTimeout(() => { hls.destroy(); hlsRef.current = null; }, 5000); });
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => video.play().catch(() => {}));
    }

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [src]);

  return <video ref={videoRef} className={`w-full h-full object-cover ${className}`} muted playsInline loop autoPlay style={{ backgroundColor: '#000' }} />;
}
