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
    if (profile?.user_settings?.font_size) {
      document.documentElement.classList.remove('font-size-small', 'font-size-large');
      if (profile.user_settings.font_size === 'small') {
        document.documentElement.classList.add('font-size-small');
      } else if (profile.user_settings.font_size === 'large') {
        document.documentElement.classList.add('font-size-large');
      }
    }

  }, [profile?.user_settings]);

  return null;
}
