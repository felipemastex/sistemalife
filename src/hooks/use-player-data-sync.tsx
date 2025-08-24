"use client";

import { useEffect } from 'react';
import { usePlayerDataContext } from './use-player-data';
import { cn } from '@/lib/utils';

export function PlayerDataSync() {
  const { profile } = usePlayerDataContext();
  
  useEffect(() => {
    if (!profile?.user_settings) return;

    const { theme_accent_color, reduce_motion, font_size, layout_density } = profile.user_settings;

    if (theme_accent_color) {
      document.documentElement.style.setProperty(
        '--theme-accent-color',
        theme_accent_color
      );
    }

    document.documentElement.classList.toggle('reduce-motion', !!reduce_motion);
    
    document.documentElement.classList.remove('font-size-small', 'font-size-large');
    if (font_size === 'small') {
      document.documentElement.classList.add('font-size-small');
    } else if (font_size === 'large') {
      document.documentElement.classList.add('font-size-large');
    }
    
    document.body.classList.remove('layout-compact', 'layout-comfortable');
    if (layout_density === 'compact') {
        document.body.classList.add('layout-compact');
    } else if (layout_density === 'comfortable') {
        document.body.classList.add('layout-comfortable');
    }


  }, [profile?.user_settings]);

  return null;
}
