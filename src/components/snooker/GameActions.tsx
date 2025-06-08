
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
    <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 my-6">
      <Button variant="outline" onClick={onUndo} disabled={!canUndo} className="w-full sm:w-auto">
        <Undo2 className="w-5 h-5 mr-2" />
        Undo Last Shot
      </Button>
      <Button variant="secondary" onClick={onNewFrame} className="w-full sm:w-auto">
        <PlusSquare className="w-5 h-5 mr-2" />
        New Frame
      </Button>
      <Button 
        variant="default" 
        onClick={onEndFrame} 
        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={disableEndFrame}
      >
        <CheckSquare className="w-5 h-5 mr-2" />
        End Frame
      </Button>
    </div>
  );
}

    