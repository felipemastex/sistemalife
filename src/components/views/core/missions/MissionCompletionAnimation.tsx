
"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Award, Gem, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

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
  onClose,
  missionName,
  xpGained,
  fragmentsGained,
  levelUp,
  newLevel
}) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
        // Delay for the dialog to open before starting content animation
        const timer = setTimeout(() => setShowContent(true), 100);
        // Automatically close the dialog after a few seconds
        const closeTimer = setTimeout(() => {
            setShowContent(false);
            // Delay closing to allow for fade-out animation
            setTimeout(onClose, 300);
        }, 3500);

        return () => {
            clearTimeout(timer);
            clearTimeout(closeTimer);
        };
    } else {
        setShowContent(false);
    }
  }, [isOpen, onClose]);
  

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-transparent border-none shadow-none max-w-md w-full p-0 flex items-center justify-center"
        hideCloseButton={true}
      >
        <div 
          className={cn(
            "bg-card/80 backdrop-blur-lg border-2 border-primary/50 rounded-xl p-8 text-center text-white w-full transition-all duration-500 ease-out",
            showContent ? "opacity-100 scale-100 transform" : "opacity-0 scale-90 transform"
          )}
        >
            <div className="relative mb-4">
                 <Star className="h-24 w-24 text-yellow-400 mx-auto animate-pulse-slow"/>
                 <CheckCircle className="h-10 w-10 text-background absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
            </div>

            <h2 className="text-2xl font-bold font-cinzel text-yellow-300">Missão Concluída!</h2>
            <p className="text-muted-foreground mt-1 mb-6 text-lg">"{missionName}"</p>

            <div className="space-y-4 text-left bg-secondary/50 p-4 rounded-lg">
                <div className="flex items-center justify-between animate-in fade-in-50 slide-in-from-bottom-4 duration-500 [animation-delay:200ms] fill-mode-both">
                    <div className="flex items-center gap-3">
                        <Zap className="h-6 w-6 text-primary"/>
                        <span className="text-lg font-medium">XP Ganho</span>
                    </div>
                    <span className="text-xl font-bold text-primary">+{xpGained}</span>
                </div>
                 <div className="flex items-center justify-between animate-in fade-in-50 slide-in-from-bottom-4 duration-500 [animation-delay:400ms] fill-mode-both">
                    <div className="flex items-center gap-3">
                        <Gem className="h-6 w-6 text-cyan-400"/>
                        <span className="text-lg font-medium">Fragmentos</span>
                    </div>
                    <span className="text-xl font-bold text-cyan-400">+{fragmentsGained}</span>
                </div>
            </div>

            {levelUp && (
                <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 animate-in fade-in-50 slide-in-from-bottom-4 duration-500 [animation-delay:600ms] fill-mode-both">
                    <h3 className="text-2xl font-bold font-cinzel text-yellow-300">NOVO NÍVEL!</h3>
                    <p className="text-3xl font-bold text-white">{newLevel}</p>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
