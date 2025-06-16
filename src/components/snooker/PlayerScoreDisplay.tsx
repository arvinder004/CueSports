
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
  const displayTitle = isTeamGameContext && teamId ? `${displayName}` : displayName; // Simpler title for team context

  return (
    <Card className={cn(
      "w-full shadow-lg transition-all duration-300 ease-in-out",
      isActive && !isTeamGameContext ? "border-accent ring-2 ring-accent bg-accent/10" : "border-card bg-card/50", // Main highlight only for active singles player on SnookerPage
      isTeamGameContext && isActive ? "bg-accent/5" : "", // Subtle highlight for active player within team
      animate ? "score-updated" : ""
    )}>
      <CardHeader className={cn(
          "pb-2 pt-3 px-3",
          isTeamGameContext ? "sm:pb-1 sm:pt-2 sm:px-2" : "sm:pb-3 sm:pt-4 sm:px-4" // Less padding for team context
        )}>
        <CardTitle className={cn(
          "font-headline flex items-center",
          isTeamGameContext ? "text-sm sm:text-base justify-start" : "text-lg sm:text-xl justify-center", // Smaller text, left align for team
          isActive && !isTeamGameContext ? "text-accent-foreground" : "text-card-foreground",
          isTeamGameContext && isActive ? "text-accent-foreground/90" : ""
        )}>
           {isSinglesMode && !isTeamGameContext && <User className="w-5 h-5 mr-2" />}
           <Input
                type="text"
                value={player.name}
                onChange={(e) => onPlayerNameChange(player.id, e.target.value)}
                placeholder={isTeamGameContext ? `Player ${player.id}` : `Player ${player.id} Name`}
                className={cn(
                  "bg-transparent border-0 focus:ring-0 p-0 h-auto",
                  isTeamGameContext ? "text-sm text-left flex-grow" : "text-base text-center w-full",
                  isActive ? "text-accent-foreground placeholder:text-accent-foreground/70 font-medium" : "text-card-foreground/90 placeholder:text-card-foreground/70"
                )}
                aria-label={`Player ${player.id} Name Input`}
                disabled={disabled}
              />
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(
          "text-center px-3 pb-3",
           isTeamGameContext ? "sm:px-2 sm:pb-2" : "sm:px-4 sm:pb-4"
        )}>
        {!isTeamGameContext && ( // Main score only for singles display on SnookerPage
            <p className={cn(
            "text-3xl sm:text-4xl font-bold font-headline mb-2",
            isActive ? "text-accent-foreground" : "text-card-foreground"
            )}>
            {mainScore}
            </p>
        )}
        
        {(showHighestBreak || (isActive && showCurrentBreakInfo && currentBreakDisplayScore !== undefined && currentBreakDisplayScore > 0)) && (
            <div className={cn(
                "flex items-center justify-center text-xs mt-1", 
                isActive ? "text-accent-foreground/80" : "text-card-foreground/80",
                isTeamGameContext ? "justify-start" : "justify-center"
            )}>
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
      </CardContent>
    </Card>
  );
}
