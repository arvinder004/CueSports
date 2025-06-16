
"use client";

import { Button } from '@/components/ui/button';
import { Undo2, PlusSquare, CheckSquare } from 'lucide-react';

interface GameActionsProps {
  onUndo: () => void;
  canUndo: boolean;
  onNewFrame: () => void;
  onEndFrame: () => void;
  disableEndFrame?: boolean;
}

export default function GameActions({ onUndo, canUndo, onNewFrame, onEndFrame, disableEndFrame }: GameActionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 my-4 sm:my-6">
      <Button 
        variant="outline" 
        onClick={onUndo} 
        disabled={!canUndo} 
        className="w-full text-sm py-2 sm:py-3"
      >
        <Undo2 className="w-4 h-4 mr-1 sm:mr-2" />
        Undo Shot
      </Button>
      <Button 
        variant="secondary" 
        onClick={onNewFrame} 
        className="w-full text-sm py-2 sm:py-3"
      >
        <PlusSquare className="w-4 h-4 mr-1 sm:mr-2" />
        New Frame
      </Button>
      <Button 
        variant="default" 
        onClick={onEndFrame} 
        className="w-full text-sm py-2 sm:py-3 bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={disableEndFrame}
      >
        <CheckSquare className="w-4 h-4 mr-1 sm:mr-2" />
        End Frame
      </Button>
    </div>
  );
}
