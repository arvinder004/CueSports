
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PartyPopper } from 'lucide-react';
import type { GameState, Player } from '@/types/snooker';

interface WinnerPopupProps {
  winnerIdentifier: string | null; // e.g., "Player 1", "Team A", or null for draw
  gameState: GameState;
  onClose: () => void;
}

export default function WinnerPopup({ winnerIdentifier, gameState, onClose }: WinnerPopupProps) {
  if (!winnerIdentifier) return null; // Or handle draw explicitly if needed

  const { gameMode, players, playerFrameScores, teamAScore, teamBScore } = gameState;

  let titleText = "Frame Over!";
  let descriptionText = "";

  if (gameMode === 'singles') {
    const winnerPlayer = players.find(p => (p.name || `Player ${p.id}`) === winnerIdentifier);
    titleText = `${winnerIdentifier} Wins!`;
    descriptionText = `Congratulations ${winnerIdentifier}, you won the frame!`;
    if (playerFrameScores) {
      descriptionText += `\nFinal Scores:\n${players[0].name || 'Player 1'}: ${playerFrameScores[0]}\n${players[1].name || 'Player 2'}: ${playerFrameScores[1]}`;
    }
  } else if (gameMode === 'doubles') {
    titleText = `${winnerIdentifier} Wins!`;
    const winningTeamPlayers = players.filter(p => p.teamId === (winnerIdentifier === 'Team A' ? 'A' : 'B'));
    const winningPlayerNames = winningTeamPlayers.map(p => p.name || `Player ${p.id}`).join(' & ');
    descriptionText = `Congratulations ${winnerIdentifier} (${winningPlayerNames}), you won the frame!`;
    descriptionText += `\nFinal Scores:\nTeam A: ${teamAScore ?? 0}\nTeam B: ${teamBScore ?? 0}`;
  }


  return (
    <AlertDialog open={!!winnerIdentifier} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-background">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-headline text-center text-primary flex items-center justify-center">
            <PartyPopper className="w-8 h-8 mr-2 text-accent" />
            {titleText}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-lg text-center text-foreground/80 pt-2 whitespace-pre-line">
            {descriptionText}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogAction onClick={onClose} className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">
            Start New Frame
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
