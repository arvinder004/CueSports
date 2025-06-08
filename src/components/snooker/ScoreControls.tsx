
"use client";

import type { Ball, BallName, GameState } from '@/types/snooker';
import { SNOOKER_BALLS } from '@/types/snooker';
import BallButton from './BallButton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle } from 'lucide-react';

interface ScoreControlsProps {
  onPot: (ball: Ball) => void;
  onFoul: () => void;
  onMiss: () => void;
  gameState: GameState;
}

export default function ScoreControls({ onPot, onFoul, onMiss, gameState }: ScoreControlsProps) {
  const { gameMode, gamePhase, lastPotWasRed, redsRemaining, nextColorInSequence, winnerIdentifier } = gameState;

  const isBallDisabled = (ballName: BallName): boolean => {
    if (!gameMode || !!winnerIdentifier) return true; // Disabled if no game mode or game has a winner

    if (gamePhase === 'reds_and_colors') {
      if (ballName === 'Red') {
        return lastPotWasRed || redsRemaining === 0;
      } else { 
        return !lastPotWasRed;
      }
    } else { // colors_sequence
      if (ballName === 'Red') return true; 
      return ballName !== nextColorInSequence; 
    }
  };

  return (
    <div className="p-2 sm:p-4 bg-secondary/50 rounded-lg shadow-inner">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1 sm:gap-2 md:gap-4 mb-4 sm:mb-6 justify-items-center">
        {SNOOKER_BALLS.map((ball) => (
          <BallButton
            key={ball.name}
            ball={ball}
            onClick={() => onPot(ball)}
            disabled={isBallDisabled(ball.name)}
          />
        ))}
      </div>
      <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
        <Button
          variant="destructive"
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground w-full sm:w-1/2 md:w-auto text-sm sm:text-base"
          onClick={onFoul}
          disabled={!gameMode || !!winnerIdentifier}
        >
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Foul
        </Button>
        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10 w-full sm:w-1/2 md:w-auto text-sm sm:text-base"
          onClick={onMiss}
          disabled={!gameMode || !!winnerIdentifier}
        >
          <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Miss
        </Button>
      </div>
    </div>
  );
}

    