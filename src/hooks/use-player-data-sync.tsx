"use client";

import { useEffect } from 'react';
import { usePlayerDataContext } from './use-player-data';

export function PlayerDataSync() {
  const { profile } = usePlayerDataContext();
  
  useEffect(() => {
    if (profile?.user_settings?.theme_accent_color) {
      document.documentElement.style.setProperty(
        '--theme-accent-color',
        profile.user_settings.theme_accent_color
      );
    }
    if (profile?.user_settings?.reduce_motion) {
        document.documentElement.classList.add('reduce-motion');
    } else {
        document.documentElement.classList.remove('reduce-motion');
    }
  }, [profile?.user_settings]);

  return null;
}
