
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
  players: [Player, Player]; // Players of this team
  activePlayerId?: number; // ID of the currently active player on this team
  scoreJustUpdated: boolean;
  onPlayerNameChange: (playerId: number, newName: string) => void;
  currentPlayerBreakScore: number; // The break score of the active player if they are on this team
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
}: TeamScoreDisplayProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (scoreJustUpdated) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300); // Duration of animation
      return () => clearTimeout(timer);
    }
  }, [scoreJustUpdated, score]);

  const isTeamActive = players.some(p => p.id === activePlayerId);

  return (
    <Card className={cn(
      "w-full shadow-lg transition-all duration-300 ease-in-out",
      isTeamActive ? "border-accent ring-2 ring-accent" : "border-card",
      animate ? "score-updated" : ""
    )}>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className={cn(
          "text-xl sm:text-2xl md:text-3xl font-headline flex items-center justify-center",
          isTeamActive ? "text-accent-foreground" : ""
        )}>
          <Users className="w-6 h-6 mr-2" /> {teamName}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className={cn(
          "text-4xl sm:text-5xl md:text-7xl font-bold font-headline mb-2 sm:mb-4",
           isTeamActive ? "text-accent-foreground" : ""
        )}>
          {score}
        </p>
        <div className="space-y-3">
          {players.map((player) => (
            <div key={player.id} className={cn(
              "p-2 rounded-md bg-card-foreground/5",
              player.id === activePlayerId ? "ring-2 ring-primary" : ""
            )}>
              <Input
                type="text"
                value={player.name}
                onChange={(e) => onPlayerNameChange(player.id, e.target.value)}
                placeholder={`Player ${player.id} Name`}
                className="w-full text-center bg-secondary/50 border-primary/30 focus:ring-accent text-sm mb-1"
                aria-label={`${teamName} Player ${player.id} Name Input`}
              />
              <div className="flex items-center justify-center text-xs sm:text-sm text-card-foreground/80">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span>HB: {player.highestBreak}</span>
                {player.id === activePlayerId && currentPlayerBreakScore > 0 && (
                   <span className="ml-2 text-primary font-semibold">Break: {currentPlayerBreakScore}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
