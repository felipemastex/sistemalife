
"use client";

import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

interface UseSwipeProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const useSwipe = ({ onSwipeLeft, onSwipeRight }: UseSwipeProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'x',
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  const handleScroll = useCallback(() => {
    if (!emblaApi) return;

    const scrollProgress = emblaApi.scrollProgress();
    
    // Thresholds for triggering swipe actions. These can be adjusted.
    if (scrollProgress < -0.1 && onSwipeLeft) {
      onSwipeLeft();
      emblaApi.scrollTo(0); // Reset position after swipe
    }
    if (scrollProgress > 0.1 && onSwipeRight) {
      onSwipeRight();
      emblaApi.scrollTo(0); // Reset position after swipe
    }

  }, [emblaApi, onSwipeLeft, onSwipeRight]);


  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('scroll', handleScroll);
      return () => {
        emblaApi.off('scroll', handleScroll);
      };
    }
  }, [emblaApi, handleScroll]);

  return { emblaRef };
};
