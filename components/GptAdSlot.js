'use client';
import { useEffect, useRef } from 'react';

/**
 * Google Publisher Tag (GPT) Ad Slot component.
 * Renders a single DFP/GAM ad unit.
 * 
 * Props:
 *   adUnitPath - Full ad unit path, e.g. '/8176806/1'
 *   sizes      - Array of [width, height] pairs, e.g. [[300, 250]]
 *   divId      - Unique div ID for this slot, e.g. 'div-gpt-ad-8176806-1'
 *   className  - Optional wrapper CSS class
 */
export default function GptAdSlot({ adUnitPath, sizes, divId, className = '' }) {
  const slotRef = useRef(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (rendered.current) return;
    rendered.current = true;

    // Ensure GPT library is loaded
    const gptScript = document.getElementById('gpt-script');
    if (!gptScript) {
      const script = document.createElement('script');
      script.id = 'gpt-script';
      script.async = true;
      script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
      document.head.appendChild(script);
    }

    window.googletag = window.googletag || { cmd: [] };

    window.googletag.cmd.push(() => {
      // Define the ad slot
      const slot = window.googletag.defineSlot(adUnitPath, sizes, divId);
      if (slot) {
        slot.addService(window.googletag.pubads());
        slotRef.current = slot;
      }
      window.googletag.pubads().enableSingleRequest();
      window.googletag.enableServices();
      window.googletag.display(divId);
    });

    return () => {
      // Cleanup: destroy the slot when unmounting
      if (slotRef.current) {
        window.googletag.cmd.push(() => {
          window.googletag.destroySlots([slotRef.current]);
        });
      }
      rendered.current = false;
    };
  }, [adUnitPath, sizes, divId]);

  return (
    <div className={className} style={{ textAlign: 'center' }}>
      <div id={divId} style={{ minHeight: sizes[0]?.[1] || 250 }} />
    </div>
  );
}
