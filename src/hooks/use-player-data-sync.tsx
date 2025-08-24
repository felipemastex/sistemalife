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
  }, [profile?.user_settings?.theme_accent_color]);

  return null;
}
