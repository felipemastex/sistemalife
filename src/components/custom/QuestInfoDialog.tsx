
"use client";

import * as React from "react";
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertCircle, Clock, X } from 'lucide-react';

export interface QuestInfoProps {
  title: string;
  description: string;
  goals: { name: string; progress: string }[];
  caution: string;
  onClose: () => void;
}

export const QuestInfoDialog = ({ title, description, goals, caution, onClose }: QuestInfoProps) => {
  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent 
        className="bg-gray-900/80 backdrop-blur-md border-2 border-cyan-400/30 text-white max-w-md w-full shadow-2xl shadow-cyan-500/10 rounded-lg p-0"
        showCloseButton={false}
      >
        <div className="p-6 relative font-sans">
          {/* Custom Close Button */}
          <button onClick={onClose} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 border-b border-cyan-400/20 pb-3 mb-4">
            <AlertCircle className="h-6 w-6 text-cyan-400" />
            <h2 className="text-xl font-bold tracking-widest uppercase text-cyan-400 font-cinzel">{title}</h2>
          </div>

          {/* Body */}
          <div className="space-y-6 text-center">
            <p className="text-lg font-semibold text-gray-200">{description}</p>
            
            <div className="space-y-2 text-left w-full max-w-sm mx-auto">
                <h3 className="text-center font-bold text-green-400 text-md tracking-wider mb-2">GOALS</h3>
                {goals.map((goal, index) => (
                    <div key={index} className="flex justify-between items-center font-mono text-gray-300 text-sm">
                        <span>{goal.name}</span>
                        <span>{goal.progress}</span>
                    </div>
                ))}
            </div>

            <p className="text-sm text-red-500 font-semibold tracking-wider uppercase bg-red-900/30 border border-red-500/50 rounded-md p-2">
                <span className="font-bold">CAUTION</span> - {caution}
            </p>

            <Clock className="h-10 w-10 text-gray-500 mx-auto" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Extend DialogContent to accept a 'showCloseButton' prop
const OriginalDialogContent = DialogContent;
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof OriginalDialogContent>,
  React.ComponentPropsWithoutRef<typeof OriginalDialogContent> & { showCloseButton?: boolean }
>(({ showCloseButton, ...props }, ref) => {
    // This is a workaround since shadcn's DialogContent doesn't let us easily remove the default close button
    // In a real scenario, we might need to fork the component or use a different approach.
    // For this purpose, we'll let it render and just add our own custom one.
  return <OriginalDialogContent ref={ref} {...props} />;
});
CustomDialogContent.displayName = "DialogContent";

Dialog.Content = CustomDialogContent;
