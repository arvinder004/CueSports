
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
  teamId?: 'A' | 'B'; 
  isTeamGameContext?: boolean; 
  disabled?: boolean; // To disable input
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
  disabled = false,
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

  // This component is used for TeamScoreDisplay and a more compact Singles display on the main Snooker page.
  // The compact singles display will be handled by the parent component's layout.
  // This component just provides the structure.

  return (
    <Card className={cn(
      "w-full shadow-lg transition-all duration-300 ease-in-out",
      isActive ? "border-accent ring-2 ring-accent bg-accent/10" : "border-card bg-card/50",
      animate ? "score-updated" : ""
    )}>
      <CardHeader className="pb-2 sm:pb-3 pt-3 sm:pt-4 px-3 sm:px-4">
        <CardTitle className={cn(
          "text-lg sm:text-xl font-headline flex items-center justify-center",
          isActive ? "text-accent-foreground" : "text-card-foreground"
        )}>
           {isSinglesMode && <User className="w-5 h-5 mr-2" />}
           {displayTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center px-3 sm:px-4 pb-3 sm:pb-4">
        <p className={cn(
          "text-3xl sm:text-4xl font-bold font-headline mb-2",
           isActive ? "text-accent-foreground" : "text-card-foreground"
        )}>
          {mainScore}
        </p>
        <div className="space-y-1">
            <div className={cn(
              "p-2 rounded-md",
              isActive ? "" : "" // No special ring needed here, parent card has it
            )}>
              <Input
                type="text"
                value={player.name}
                onChange={(e) => onPlayerNameChange(player.id, e.target.value)}
                placeholder={isTeamGameContext ? `Team ${teamId} - Player ${player.id}` : `Player ${player.id} Name`}
                className={cn(
                  "w-full text-center bg-transparent border-0 focus:ring-0 text-sm mb-1",
                  isActive ? "text-accent-foreground placeholder:text-accent-foreground/70 font-medium" : "text-card-foreground/90 placeholder:text-card-foreground/70",
                  "border-b", // Add a bottom border for the input
                  isActive ? "border-accent/50" : "border-card-foreground/30"
                )}
                aria-label={`Player ${player.id} Name Input`}
                disabled={disabled}
              />
              {(showHighestBreak || (isActive && showCurrentBreakInfo && currentBreakDisplayScore !== undefined && currentBreakDisplayScore > 0)) && (
                <div className={cn("flex items-center justify-center text-xs text-card-foreground/80 mt-1", isActive ? "text-accent-foreground/80" : "text-card-foreground/80")}>
                  {showHighestBreak && player.highestBreak > 0 && (
                    <>
                      <Trophy className="w-3 h-3 mr-1" />
                      <span>HB: {player.highestBreak}</span>
                    </>
                  )}
                  {isActive && showCurrentBreakInfo && currentBreakDisplayScore !== undefined && currentBreakDisplayScore > 0 && (
                    <span className={cn("ml-2 font-semibold", isActive ? "text-accent-foreground" : "text-primary")}>
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

