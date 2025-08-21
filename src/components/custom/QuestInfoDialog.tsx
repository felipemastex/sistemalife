
"use client";

import * as React from "react";
import { Dialog, DialogContent as OriginalDialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Clock, X } from 'lucide-react';
import { cn } from "@/lib/utils";

export interface QuestInfoProps {
  title: string;
  description: string;
  goals: { name: string; progress: string }[];
  caution: string;
  onClose: () => void;
}

const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof OriginalDialogContent>,
  React.ComponentPropsWithoutRef<typeof OriginalDialogContent> & { showCloseButton?: boolean }
>(({ children, className, showCloseButton = true, ...props }, ref) => {
    const customProps = {...props};
    if(showCloseButton === false) {
        // this is a custom prop, so we need to remove it before passing to the DOM element
        delete customProps.showCloseButton;
    }
  return (
    <OriginalDialogContent ref={ref} className={className} {...customProps}>
      {children}
      {!showCloseButton && (
        <button onClick={() => {
            const event = new CustomEvent('close-dialog');
            document.dispatchEvent(event)
        }} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <span className="sr-only">Close</span>
        </button>
      )}
    </OriginalDialogContent>
  );
});
CustomDialogContent.displayName = "DialogContent";


export const QuestInfoDialog = ({ title, description, goals, caution, onClose }: QuestInfoProps) => {
  
  React.useEffect(() => {
    const handleClose = () => onClose();
    // Since we can't easily stop propagation from the original close button,
    // we use a custom event system as a workaround.
    document.addEventListener('close-dialog', handleClose);
    return () => {
      document.removeEventListener('close-dialog', handleClose);
    };
  }, [onClose]);

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <CustomDialogContent 
        className="bg-gray-900/80 backdrop-blur-md border-2 border-cyan-400/30 text-white max-w-md w-full shadow-2xl shadow-cyan-500/10 rounded-lg p-0"
        showCloseButton={false}
      >
        <div className="p-6 relative font-sans">
          {/* Custom Close Button */}
          <button onClick={onClose} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white transition-colors z-10">
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 border-b border-cyan-400/20 pb-3 mb-4">
            <AlertCircle className="h-6 w-6 text-cyan-400" />
            <DialogTitle asChild>
                <h2 className="text-xl font-bold tracking-widest uppercase text-cyan-400 font-cinzel">{title}</h2>
            </DialogTitle>
          </div>
            <DialogDescription className="sr-only">{description}</DialogDescription>

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
      </CustomDialogContent>
    </Dialog>
  );
};
