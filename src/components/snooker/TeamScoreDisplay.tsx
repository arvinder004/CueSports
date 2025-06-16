
"use client";

import type { Player } from '@/types/snooker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Trophy, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TeamScoreDisplayProps {
  teamId: 'A' | 'B';
  teamName: string;
  score: number;
  players: [Player, Player]; 
  activePlayerId?: number; 
  scoreJustUpdated: boolean;
  onPlayerNameChange: (playerId: number, newName: string) => void;
  currentPlayerBreakScore: number; 
  disabled?: boolean; // To disable inputs if game ended
}

export default function TeamScoreDisplay({
  teamId,
  teamName,
  score,
  players,
  activePlayerId,
  scoreJustUpdated,
  onPlayerNameChange,
  currentPlayerBreakScore,
  disabled = false,
}: TeamScoreDisplayProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (scoreJustUpdated) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300); 
      return () => clearTimeout(timer);
    }
  }, [scoreJustUpdated, score]);

  const isTeamActive = players.some(p => p.id === activePlayerId);

  return (
    <Card className={cn(
      "w-full shadow-lg transition-all duration-300 ease-in-out",
      isTeamActive ? "border-accent ring-2 ring-accent bg-accent/10" : "border-card bg-card/50",
      animate ? "score-updated" : ""
    )}>
      <CardHeader className="pb-2 sm:pb-3 pt-3 sm:pt-4 px-3 sm:px-4">
        <CardTitle className={cn(
          "text-xl sm:text-2xl font-headline flex items-center justify-center",
          isTeamActive ? "text-accent-foreground" : "text-card-foreground"
        )}>
          <Users className="w-6 h-6 mr-2" /> {teamName}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center px-3 sm:px-4 pb-3 sm:pb-4">
        <p className={cn(
          "text-4xl sm:text-5xl font-bold font-headline mb-2 sm:mb-4",
           isTeamActive ? "text-accent-foreground" : "text-card-foreground"
        )}>
          {score}
        </p>
        <div className="space-y-3">
          {players.map((player) => (
            <div key={player.id} className={cn(
              "p-2 rounded-md bg-card/5", // Slightly different background for inner player cards
              player.id === activePlayerId ? "ring-1 ring-primary" : ""
            )}>
              <Input
                type="text"
                value={player.name}
                onChange={(e) => onPlayerNameChange(player.id, e.target.value)}
                placeholder={`Player ${player.id} Name`}
                className={cn(
                    "w-full text-center bg-transparent border-0 focus:ring-0 text-sm mb-1",
                    player.id === activePlayerId ? "text-accent-foreground placeholder:text-accent-foreground/70 font-medium" : "text-card-foreground/90 placeholder:text-card-foreground/70",
                    "border-b", 
                    player.id === activePlayerId ? "border-accent/50" : "border-card-foreground/30"
                    )}
                aria-label={`${teamName} Player ${player.id} Name Input`}
                disabled={disabled}
              />
              <div className={cn("flex items-center justify-center text-xs text-card-foreground/80", player.id === activePlayerId ? "text-accent-foreground/80" : "text-card-foreground/80")}>
                <Trophy className="w-3 h-3 mr-1" />
                <span>HB: {player.highestBreak}</span>
                {player.id === activePlayerId && currentPlayerBreakScore > 0 && (
                   <span className={cn("ml-2 font-semibold", isTeamActive ? "text-accent-foreground" : "text-primary")}>Break: {currentPlayerBreakScore}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

