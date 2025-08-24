"use client";

import React, { useEffect } from "react";

interface MissionCompletionAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  missionName: string;
  xpGained: number;
  fragmentsGained: number;
  levelUp?: boolean;
  newLevel?: number;
}

export const MissionCompletionAnimation: React.FC<MissionCompletionAnimationProps> = ({
  isOpen,
  onClose
}) => {
  useEffect(() => {
    if (isOpen) {
      // Apenas chama onClose imediatamente sem efeitos visuais
      onClose();
    }
  }, [isOpen, onClose]);

  // Não renderiza nada - sem efeitos visuais
  return null;
};