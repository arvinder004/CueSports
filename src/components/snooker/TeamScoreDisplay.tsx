
"use client";

import type { Player } from '@/types/snooker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import PlayerScoreDisplay from './PlayerScore'; // Re-using the more detailed player display

interface TeamScoreDisplayProps {
  teamId: 'A' | 'B';
  teamName: string;
  score: number;
  players: [Player, Player]; 
  activePlayerId?: number; 
  scoreJustUpdated: boolean;
  onPlayerNameChange: (playerId: number, newName: string) => void;
  currentPlayerBreakScore: number; 
  disabled?: boolean;
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
          "text-4xl sm:text-5xl font-bold font-headline mb-3 sm:mb-4",
           isTeamActive ? "text-accent-foreground" : "text-card-foreground"
        )}>
          {score}
        </p>
        <div className="space-y-2">
          {players.map((player) => (
            <PlayerScoreDisplay
                key={player.id}
                player={player}
                mainScore={player.score} // In this context, mainScore for PScoreDisplay is individual break.
                isActive={player.id === activePlayerId}
                isSinglesMode={false} // Explicitly false as we are in team context
                scoreJustUpdated={false} // Team card handles overall score update animation
                onPlayerNameChange={onPlayerNameChange}
                currentBreakDisplayScore={player.id === activePlayerId ? currentPlayerBreakScore : 0}
                showHighestBreak={true}
                showCurrentBreakInfo={true}
                teamId={teamId}
                isTeamGameContext={true}
                disabled={disabled}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
