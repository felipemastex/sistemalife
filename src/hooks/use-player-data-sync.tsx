
"use client";

import { useEffect } from 'react';
import { usePlayerDataContext } from './use-player-data';
import { cn } from '@/lib/utils';

export function PlayerDataSync() {
  const { profile } = usePlayerDataContext();
  
  useEffect(() => {
    if (!profile?.user_settings) return;

    const { theme_accent_color, reduce_motion } = profile.user_settings;

    document.documentElement.style.setProperty(
      '--theme-accent-color',
      theme_accent_color || '198 90% 55%'
    );
    
    document.body.classList.toggle('reduce-motion', !!reduce_motion);

  }, [profile?.user_settings]);

  return null;
}
