
"use client";

import type { Player } from '@/types/snooker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Trophy, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PlayerScoreDisplayProps {
  player: Player;
  mainScore: number;
  isActive: boolean;
  isSinglesMode: boolean;
  scoreJustUpdated: boolean;
  onPlayerNameChange: (playerId: number, newName: string) => void;
  currentBreakDisplayScore?: number;
  showHighestBreak?: boolean;
  showCurrentBreakInfo?: boolean;
  teamId?: 'A' | 'B'; // Added for Century team display
  isTeamGameContext?: boolean; // To know if we should display teamId
}

export default function PlayerScoreDisplay({
  player,
  mainScore,
  isActive,
  isSinglesMode,
  scoreJustUpdated,
  onPlayerNameChange,
  currentBreakDisplayScore,
  showHighestBreak = true,
  showCurrentBreakInfo = true,
  teamId,
  isTeamGameContext = false,
}: PlayerScoreDisplayProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (scoreJustUpdated) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [scoreJustUpdated, mainScore, player.score]);

  const displayName = player.name || `Player ${player.id}`;
  const displayTitle = isTeamGameContext && teamId ? `${displayName} (Team ${teamId})` : displayName;

  return (
    <Card className={cn(
      "w-full shadow-lg transition-all duration-300 ease-in-out",
      isActive ? "border-accent ring-2 ring-accent" : "border-card",
      animate ? "score-updated" : ""
    )}>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className={cn(
          "text-xl sm:text-2xl md:text-3xl font-headline flex items-center justify-center",
          isActive ? "text-accent-foreground" : "text-card-foreground"
        )}>
          <User className="w-6 h-6 mr-2" /> {displayTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className={cn(
          "text-4xl sm:text-5xl md:text-7xl font-bold font-headline mb-2 sm:mb-4",
           isActive ? "text-accent-foreground" : "text-card-foreground"
        )}>
          {mainScore}
        </p>
        <div className="space-y-3">
            <div className={cn(
              "p-2 rounded-md bg-card-foreground/5",
              isActive ? "ring-1 ring-primary/50" : ""
            )}>
              <Input
                type="text"
                value={player.name}
                onChange={(e) => onPlayerNameChange(player.id, e.target.value)}
                placeholder={`Player ${player.id} Name`}
                className="w-full text-center bg-secondary/50 border-primary/30 focus:ring-accent text-sm mb-1 text-card-foreground/90 placeholder:text-card-foreground/60"
                aria-label={`Player ${player.id} Name Input`}
              />
              {(showHighestBreak || (isActive && showCurrentBreakInfo && currentBreakDisplayScore !== undefined && currentBreakDisplayScore > 0)) && (
                <div className="flex items-center justify-center text-xs sm:text-sm text-card-foreground/80 mt-1">
                  {showHighestBreak && (
                    <>
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span>HB: {player.highestBreak}</span>
                    </>
                  )}
                  {isActive && showCurrentBreakInfo && currentBreakDisplayScore !== undefined && currentBreakDisplayScore > 0 && (
                    <span className={cn("ml-2 font-semibold", isActive ? "text-primary" : "text-card-foreground/80")}>
                      Break: {currentBreakDisplayScore}
                    </span>
                  )}
                </div>
              )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
