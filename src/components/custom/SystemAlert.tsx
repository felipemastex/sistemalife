
"use client";

import { useState, useEffect } from 'react';
import { Bot, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SystemAlertProps {
  message: string;
  position: { top: string; left: string; };
  onDismiss: () => void;
}

export const SystemAlert = ({ message, position, onDismiss }: SystemAlertProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setIsVisible(true);

    // Auto-dismiss after some time
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, 12000); // 12 seconds

    return () => clearTimeout(dismissTimer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Allow time for fade-out animation before calling onDismiss
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
      )}
      style={{ top: position.top, left: position.left, transform: 'translateX(-50%)' }}
    >
      <Card className="max-w-xs bg-gray-900/80 backdrop-blur-md border-2 border-cyan-400/30 text-white shadow-2xl shadow-cyan-500/10">
        <CardContent className="p-3 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-1 right-1 p-1 text-cyan-400/50 hover:text-cyan-400"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <Bot className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm pr-4">{message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
