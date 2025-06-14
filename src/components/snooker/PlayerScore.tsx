
"use client";

import type { Player } from '@/types/snooker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Trophy, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PlayerScoreDisplayProps {
  player: Player;
  mainScore: number; // Frame score for Snooker, total score for Century
  isActive: boolean;
  isSinglesMode: boolean; // True for Snooker Singles, or any Century non-team game
  scoreJustUpdated: boolean;
  onPlayerNameChange: (playerId: number, newName: string) => void;
  currentBreakDisplayScore?: number; // Only for Snooker: current player's active break
  showHighestBreak?: boolean; // Default true, pass false for Century
  showCurrentBreakInfo?: boolean; // Default true, pass false for Century
  teamId?: 'A' | 'B'; 
  isTeamGameContext?: boolean; // True if the game mode is team-based (e.g. Century Doubles)
}

export default function PlayerScoreDisplay({
  player,
  mainScore,
  isActive,
  isSinglesMode, // This prop might be better named or handled based on context
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
          isActive ? "text-accent-foreground" : "text-card-foreground" // Use card-foreground for inactive
        )}>
          <User className="w-6 h-6 mr-2" /> {displayTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className={cn(
          "text-4xl sm:text-5xl md:text-7xl font-bold font-headline mb-2 sm:mb-4",
           isActive ? "text-accent-foreground" : "text-card-foreground" // Use card-foreground for inactive
        )}>
          {mainScore}
        </p>
        <div className="space-y-3">
            <div className={cn(
              "p-2 rounded-md bg-card-foreground/5", // Use card-foreground/5 for bg
              isActive ? "ring-1 ring-primary/50" : ""
            )}>
              <Input
                type="text"
                value={player.name}
                onChange={(e) => onPlayerNameChange(player.id, e.target.value)}
                placeholder={`Player ${player.id} Name`}
                className="w-full text-center bg-secondary/50 border-primary/30 focus:ring-accent text-sm mb-1 text-card-foreground/90 placeholder:text-card-foreground/60" // Use card-foreground for placeholder
                aria-label={`Player ${player.id} Name Input`}
              />
              {(showHighestBreak || (isActive && showCurrentBreakInfo && currentBreakDisplayScore !== undefined && currentBreakDisplayScore > 0)) && (
                <div className="flex items-center justify-center text-xs sm:text-sm text-card-foreground/80 mt-1">
                  {showHighestBreak && player.highestBreak > 0 && ( // Only show HB if > 0 for Snooker
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
