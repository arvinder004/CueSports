
"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { Player } from '@/types/snooker';
import { PartyPopper, Trophy } from 'lucide-react';

interface CenturyWinnerPopupProps {
  winnerName: string; 
  targetScore: number;
  players: Player[];
  onNewGame: () => void;
  isTeamGame: boolean;
  teamAScore?: number;
  teamBScore?: number;
}

export default function CenturyWinnerPopup({ 
  winnerName, 
  targetScore, 
  players, 
  onNewGame,
  isTeamGame,
  teamAScore,
  teamBScore 
}: CenturyWinnerPopupProps) {
  
  const titleText = winnerName === "Draw" ? "It's a Draw!" : `${winnerName} Wins!`;
  let descriptionText = "";

  if (winnerName === "Draw") {
    descriptionText = `The game ended in a draw. Target score was ${targetScore}.`;
  } else if (isTeamGame) {
    descriptionText = `Congratulations, ${winnerName}! Your team reached the target score of ${targetScore}!`;
  } else {
     descriptionText = `Congratulations, ${winnerName}! You reached the target score of ${targetScore}!`;
  }
  // If game was ended manually and winner didn't hit target, adjust description
  const winnerPlayer = players.find(p => (p.name || `Player ${p.id}`) === winnerName);
  const winnerScore = isTeamGame ? (winnerName === 'Team A' ? teamAScore : teamBScore) : winnerPlayer?.score;

  if (winnerName !== "Draw" && winnerScore !== undefined && winnerScore !== targetScore) {
    descriptionText = `Congratulations, ${winnerName}! The game was ended. Your score: ${winnerScore}. Target was: ${targetScore}.`;
  }


  return (
    <AlertDialog open={true} onOpenChange={(open) => !open && onNewGame()}>
      <AlertDialogContent className="bg-background">
        <AlertDialogHeader className="items-center">
          <Trophy className="w-16 h-16 text-accent mb-4" />
          <AlertDialogTitle className="text-3xl font-headline text-center text-primary">
            {titleText}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-lg text-center text-foreground/80 pt-2">
            {descriptionText}
          </AlertDialogDescription>
          
          <div className="mt-6 text-sm text-left w-full max-w-xs mx-auto bg-secondary/30 p-3 rounded-md">
            <h4 className="font-semibold mb-2 text-center text-primary">Final Scores:</h4>
            <ul className="space-y-1">
              {isTeamGame ? (
                <>
                  <li className="flex justify-between text-foreground/90">
                    <span>Team A:</span>
                    <span className="font-semibold">{teamAScore}</span>
                  </li>
                  <li className="flex justify-between text-foreground/90">
                    <span>Team B:</span>
                    <span className="font-semibold">{teamBScore}</span>
                  </li>
                </>
              ) : (
                players.map(player => (
                  <li key={player.id} className="flex justify-between text-foreground/90">
                    <span>{player.name || `Player ${player.id}`}:</span>
                    <span className="font-semibold">{player.score}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <Button onClick={onNewGame} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3">
            <PartyPopper className="w-5 h-5 mr-2" />
            Start New Century Game
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
