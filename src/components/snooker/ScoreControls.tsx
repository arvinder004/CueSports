
"use client";

import type { Ball, BallName, GameState } from '@/types/snooker';
import { SNOOKER_BALLS, FOUL_POINTS } from '@/types/snooker';
import BallButton from './BallButton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';

interface ScoreControlsProps {
  onPot: (ball: Ball) => void;
  onFoul: (points: number) => void;
  onMiss: () => void;
  gameState: GameState;
}

export default function ScoreControls({ onPot, onFoul, onMiss, gameState }: ScoreControlsProps) {
  const { gameMode, gamePhase, lastPotWasRed, redsRemaining, nextColorInSequence, winnerIdentifier } = gameState;
  const [selectedFoulValue, setSelectedFoulValue] = useState<number>(FOUL_POINTS);

  const isBallDisabled = (ballName: BallName): boolean => {
    if (!gameMode || !!winnerIdentifier) return true;

    if (gamePhase === 'reds_and_colors') {
      if (ballName === 'Red') {
        return lastPotWasRed || redsRemaining === 0;
      } else { 
        return !lastPotWasRed;
      }
    } else { 
      if (ballName === 'Red') return true; 
      return ballName !== nextColorInSequence; 
    }
  };

  return (
    <div className="p-2 sm:p-4 bg-secondary/50 rounded-lg shadow-inner">
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-x-1 gap-y-2 sm:gap-x-2 md:gap-4 mb-4 sm:mb-6 justify-items-center items-start">
        {SNOOKER_BALLS.map((ball) => (
          <div key={ball.name} className="flex flex-col items-center space-y-1 w-full">
            <BallButton
              ball={ball}
              onClick={() => onPot(ball)}
              disabled={isBallDisabled(ball.name)}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Select
                value={String(selectedFoulValue)}
                onValueChange={(value) => setSelectedFoulValue(Number(value))}
                disabled={!gameMode || !!winnerIdentifier}
            >
                <SelectTrigger className="w-20 sm:w-24 h-10 text-sm sm:text-base bg-background border-input">
                    <SelectValue placeholder="Foul Pts" />
                </SelectTrigger>
                <SelectContent>
                    {[4, 5, 6, 7].map(points => (
                        <SelectItem key={points} value={String(points)}>{points} pts</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button
              variant="destructive"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex-grow h-10 text-sm sm:text-base"
              onClick={() => onFoul(selectedFoulValue)}
              disabled={!gameMode || !!winnerIdentifier}
            >
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Foul
            </Button>
        </div>
        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10 w-full sm:w-auto h-10 text-sm sm:text-base"
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

