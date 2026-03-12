'use client';
import React, { useState, useEffect } from 'react';
import YardChat from '@/components/YardChat';
import { auth } from '@/lib/auth';

export default function ChatPopoutPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = auth.getUser();
    if (u) setUser(u);

    const handleStorage = (e) => {
      if (e.key === 'railstream_user') {
        const u = auth.getUser();
        setUser(u);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleDock = () => {
    // Signal the main window to re-open the chat panel
    localStorage.setItem('railstream_dock_chat', Date.now().toString());
    window.close();
  };

  return (
    <div className="h-screen w-screen bg-zinc-900">
      <YardChat
        user={user}
        isPopout={true}
        onClose={handleDock}
        onDock={handleDock}
      />
    </div>
  );
}
