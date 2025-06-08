
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import BallButton from '@/components/snooker/BallButton';
import PlayerScoreDisplay from '@/components/snooker/PlayerScore';
import CenturyWinnerPopup from '@/components/century/CenturyWinnerPopup';
import type { Player, Ball, CenturyGameModeId, CenturyModeConfig } from '@/types/snooker';
import { CENTURY_BALLS, CENTURY_FOUL_POINTS } from '@/types/snooker';
import { useToast } from '@/hooks/use-toast';
import { Home, RotateCcw, AlertTriangle, MinusCircle, ArrowRightCircle, UserCircle, ArrowLeft, Users, UserPlus, SquareUserRound, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOCAL_STORAGE_KEY_CENTURY = 'centuryGameState';

interface CenturyStoredState {
  selectedModeId: CenturyGameModeId | null;
  isGameInitialized: boolean;
  players: Player[];
  teamAScore: number;
  teamBScore: number;
  currentPlayerIndex: number;
  winner: Player | 'Team A' | 'Team B' | null;
}

const createInitialPlayer = (id: number, name: string, teamId?: 'A' | 'B'): Player => ({
  id,
  name: name, // Initialize with empty string for placeholder
  score: 0,
  highestBreak: 0,
  teamId,
});

const CENTURY_MODES_CONFIG: Record<CenturyGameModeId, CenturyModeConfig> = {
  'singles-2': { id: 'singles-2', numTotalPlayers: 2, isTeamGame: false, targetScore: 100, label: "Singles (2 Players - Target 100)", icon: UserCircle },
  'singles-3': { id: 'singles-3', numTotalPlayers: 3, isTeamGame: false, targetScore: 100, label: "Singles (3 Players - Target 100)", icon: UserCircle },
  'singles-4': { id: 'singles-4', numTotalPlayers: 4, isTeamGame: false, targetScore: 100, label: "Singles (4 Players - Target 100)", icon: UserCircle },
  'singles-5': { id: 'singles-5', numTotalPlayers: 5, isTeamGame: false, targetScore: 100, label: "Singles (5 Players - Target 100)", icon: UserCircle },
  'singles-6': { id: 'singles-6', numTotalPlayers: 6, isTeamGame: false, targetScore: 100, label: "Singles (6 Players - Target 100)", icon: UserCircle },
  'singles-7': { id: 'singles-7', numTotalPlayers: 7, isTeamGame: false, targetScore: 100, label: "Singles (7 Players - Target 100)", icon: UserCircle },
  'singles-8': { id: 'singles-8', numTotalPlayers: 8, isTeamGame: false, targetScore: 100, label: "Singles (8 Players - Target 100)", icon: UserCircle },
  doubles: { id: 'doubles', numTotalPlayers: 4, isTeamGame: true, playersPerTeam: 2, targetScore: 200, label: "Doubles (Target 200)", icon: Users },
  triples: { id: 'triples', numTotalPlayers: 6, isTeamGame: true, playersPerTeam: 3, targetScore: 300, label: "Triples (Target 300)", icon: UsersRound },
  quadruples: { id: 'quadruples', numTotalPlayers: 8, isTeamGame: true, playersPerTeam: 4, targetScore: 400, label: "Quadruples (Target 400)", icon: SquareUserRound },
};

type ToastInfo = {
  title: string;
  description?: string;
  variant?: "destructive" | "default";
};

export default function CenturyPage() {
  const [selectedModeId, setSelectedModeId] = useState<CenturyGameModeId | null>(null);
  const [isGameInitialized, setIsGameInitialized] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [winner, setWinner] = useState<Player | 'Team A' | 'Team B' | null>(null);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const { toast } = useToast();
  const [scoreUpdateForPlayer, setScoreUpdateForPlayer] = useState<number | undefined>(undefined);
  const [scoreUpdateForTeam, setScoreUpdateForTeam] = useState<'A' | 'B' | undefined>(undefined);
  const [toastInfo, setToastInfo] = useState<ToastInfo | null>(null);


  const activePlayer = players[currentPlayerIndex];
  const currentModeConfig = selectedModeId ? CENTURY_MODES_CONFIG[selectedModeId] : null;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGame = localStorage.getItem(LOCAL_STORAGE_KEY_CENTURY);
      if (savedGame) {
        try {
          const loadedState = JSON.parse(savedGame) as CenturyStoredState;
          if (loadedState && loadedState.selectedModeId) {
            setSelectedModeId(loadedState.selectedModeId);
            setIsGameInitialized(loadedState.isGameInitialized);
            setPlayers(loadedState.players);
            setTeamAScore(loadedState.teamAScore);
            setTeamBScore(loadedState.teamBScore);
            setCurrentPlayerIndex(loadedState.currentPlayerIndex);
            setWinner(loadedState.winner);
            setShowWinnerPopup(!!loadedState.winner); // Sync popup state
          }
        } catch (error) {
          console.error("Failed to load century game state from localStorage:", error);
          localStorage.removeItem(LOCAL_STORAGE_KEY_CENTURY);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isGameInitialized) {
      const stateToSave: CenturyStoredState = {
        selectedModeId,
        isGameInitialized,
        players,
        teamAScore,
        teamBScore,
        currentPlayerIndex,
        winner,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_CENTURY, JSON.stringify(stateToSave));
    }
  }, [selectedModeId, isGameInitialized, players, teamAScore, teamBScore, currentPlayerIndex, winner]);


  useEffect(() => {
    if (toastInfo) {
      toast({ title: toastInfo.title, description: toastInfo.description, variant: toastInfo.variant });
      setToastInfo(null);
    }
  }, [toastInfo, toast]);

  useEffect(() => {
    if (scoreUpdateForPlayer !== undefined) {
      const timer = setTimeout(() => setScoreUpdateForPlayer(undefined), 300);
      return () => clearTimeout(timer);
    }
  }, [scoreUpdateForPlayer]);

   useEffect(() => {
    if (scoreUpdateForTeam !== undefined) {
      const timer = setTimeout(() => setScoreUpdateForTeam(undefined), 300);
      return () => clearTimeout(timer);
    }
  }, [scoreUpdateForTeam]);

  const initializeGame = (modeId: CenturyGameModeId) => {
    const config = CENTURY_MODES_CONFIG[modeId];
    setSelectedModeId(modeId);

    const initialPlayers: Player[] = [];
    for (let i = 0; i < config.numTotalPlayers; i++) {
      let teamId: 'A' | 'B' | undefined = undefined;
      if (config.isTeamGame) {
        teamId = i % 2 === 0 ? 'A' : 'B';
      }
      initialPlayers.push(createInitialPlayer(i + 1, '', teamId));
    }
    setPlayers(initialPlayers);
    setTeamAScore(0);
    setTeamBScore(0);
    setCurrentPlayerIndex(0);
    setWinner(null);
    setShowWinnerPopup(false);
    setIsGameInitialized(true);
    setToastInfo({ title: `${config.label} Game Started`, description: `First to score exactly ${config.targetScore} points wins.` });
  };

  const handlePlayerNameChange = (playerId: number, newName: string) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(p =>
        p.id === playerId ? { ...p, name: newName } : p
      )
    );
  };

  const updateScoresAndCheckWin = (playerIndex: number, pointsChange: number, actionType: 'pot' | 'deduct' | 'foul_penalty' | 'reset' = 'pot') => {
    if (!currentModeConfig) return;

    setPlayers(prevPlayers => {
      const updatedPlayers = prevPlayers.map((p, idx) => {
        if (idx === playerIndex) {
          const newScore = p.score + pointsChange;
          return { ...p, score: newScore };
        }
        return p;
      });

      let newTeamAScore = 0;
      let newTeamBScore = 0;
      if (currentModeConfig.isTeamGame) {
        updatedPlayers.forEach(p => {
          if (p.teamId === 'A') newTeamAScore += p.score;
          else if (p.teamId === 'B') newTeamBScore += p.score;
        });
        setTeamAScore(newTeamAScore);
        setTeamBScore(newTeamBScore);
        if (updatedPlayers[playerIndex]?.teamId === 'A') setScoreUpdateForTeam('A');
        if (updatedPlayers[playerIndex]?.teamId === 'B') setScoreUpdateForTeam('B');
      }

      setScoreUpdateForPlayer(updatedPlayers[playerIndex].id);

      const target = currentModeConfig.targetScore;
      const playerToCheck = updatedPlayers[playerIndex];
      const playerName = playerToCheck.name || `Player ${playerToCheck.id}`;

      let localToastTitle = "";
      let localToastDescription = "";
      let localToastVariant: "destructive" | "default" | undefined = undefined;


      const scoreAfterChange = playerToCheck.score;

      if (actionType === 'pot') {
          localToastTitle = `${playerName} scored!`;
          localToastDescription = `+${pointsChange} points. New Score: ${scoreAfterChange}`;
      } else if (actionType === 'deduct') {
          localToastTitle = `${playerName} deducted points!`;
          localToastDescription = `${pointsChange} points. New Score: ${scoreAfterChange}`;
          localToastVariant = "destructive";
      } else if (actionType === 'foul_penalty') {
            localToastTitle = `Foul by ${playerName}!`;
            localToastDescription = `${pointsChange} points deducted. New Score: ${scoreAfterChange}`;
            localToastVariant = "destructive";
      } else if (actionType === 'reset') {
          localToastTitle = `${playerName}'s Score Reset`;
          localToastDescription = `Score is now ${scoreAfterChange}.`;
      }

      if (localToastTitle) {
        setToastInfo({ title: localToastTitle, description: localToastDescription, variant: localToastVariant });
      }


      if (currentModeConfig.isTeamGame) {
        const currentTeamId = playerToCheck.teamId;
        const currentTeamScore = currentTeamId === 'A' ? newTeamAScore : newTeamBScore;
        const teamIdentifier = `Team ${currentTeamId}`;

        if (currentTeamScore === target) {
          setWinner(teamIdentifier as 'Team A' | 'Team B');
          setShowWinnerPopup(true);
          setToastInfo({ title: `${teamIdentifier} Wins!`, description: `Reached the target score of ${target}!` });
        } else if (currentTeamScore > target) {
          setToastInfo({ title: "Team Overshot!", description: `${teamIdentifier}'s score is ${currentTeamScore}. Must hit ${target} exactly.`, variant: "destructive" });
        }
      } else {
        if (scoreAfterChange === target) {
          setWinner(playerToCheck);
          setShowWinnerPopup(true);
          setToastInfo({ title: `${playerName} Wins!`, description: `Reached the target score of ${target}!` });
        } else if (scoreAfterChange > target) {
          setToastInfo({ title: "Overshot!", description: `${playerName}'s score is ${scoreAfterChange}. Must hit ${target} exactly.`, variant: "destructive" });
        }
      }
      return updatedPlayers;
    });
  };


  const handlePot = (ball: Ball) => {
    if (!activePlayer || winner) return;
    updateScoresAndCheckWin(currentPlayerIndex, ball.value, 'pot');
  };

  const handleDeduct = (ball: Ball) => {
    if (!activePlayer || winner || !currentModeConfig) return;
    updateScoresAndCheckWin(currentPlayerIndex, -ball.value, 'deduct');
    if (!winner && currentModeConfig.numTotalPlayers > 1) {
        handleEndTurn();
    }
  };

  const handleFoul = () => {
    if (winner || !activePlayer || !currentModeConfig) return;

    const playerName = activePlayer.name || `Player ${activePlayer.id}`;
    updateScoresAndCheckWin(currentPlayerIndex, -CENTURY_FOUL_POINTS, 'foul_penalty');


    if (currentModeConfig.numTotalPlayers > 1 && !winner) {
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
      setCurrentPlayerIndex(nextPlayerIndex);
       setToastInfo({
          title: `Turn switched to ${players[nextPlayerIndex]?.name || `Player ${players[nextPlayerIndex]?.id}`}`,
          description: `${playerName} fouled. Score updated. It's now ${players[nextPlayerIndex]?.name || `Player ${players[nextPlayerIndex]?.id}`}'s turn.`,
        });
    }
  };

  const handleEndTurn = () => {
    if (winner || !currentModeConfig || currentModeConfig.numTotalPlayers <= 1) return;
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    setToastInfo({
      title: `Turn Ended for ${activePlayer.name || `Player ${activePlayer.id}`}`,
      description: `It's now ${players[nextPlayerIndex]?.name || `Player ${players[nextPlayerIndex]?.id}`}'s turn.`,
    });
    setCurrentPlayerIndex(nextPlayerIndex);
  };

  const handleResetPlayerScore = () => {
    if (!activePlayer || winner) return;
    const pointsToReset = -activePlayer.score;
    updateScoresAndCheckWin(currentPlayerIndex, pointsToReset, 'reset');
  };

  const handleNewGame = () => {
    setIsGameInitialized(false);
    setSelectedModeId(null);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setTeamAScore(0);
    setTeamBScore(0);
    setWinner(null);
    setShowWinnerPopup(false);
    if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEY_CENTURY);
    }
  };

 const getPlayerGridCols = () => {
    if (!currentModeConfig) return 'grid-cols-1 sm:grid-cols-1';

    const { numTotalPlayers, isTeamGame } = currentModeConfig;

    if (isTeamGame) {
        if (numTotalPlayers === 4) return 'md:grid-cols-2';
        if (numTotalPlayers === 6) return 'md:grid-cols-2';
        if (numTotalPlayers === 8) return 'md:grid-cols-2';
    } else {
        switch (numTotalPlayers) {
            case 1: // Should not happen with new modes, but kept for safety
                return 'grid-cols-1';
            case 2:
                return 'grid-cols-1 sm:grid-cols-2';
            case 3:
                return 'grid-cols-1 sm:grid-cols-3';
            case 4:
                return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
            case 5:
                return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'; // Adjust as needed, 5 might be tricky
            case 6:
                return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'; // 2x3 grid
            case 7:
                return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'; // e.g. 4 on top, 3 on bottom (requires more complex CSS or leave as is)
            case 8:
                return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'; // 2x4 grid
            default:
                return 'grid-cols-1 sm:grid-cols-2'; // Fallback
        }
    }
    return 'grid-cols-1 sm:grid-cols-1'; // Default fallback
};


  if (!isGameInitialized || !currentModeConfig) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background font-body">
        <div className="w-full max-w-3xl mb-4 self-start">
         <Link href="/" passHref>
            <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">Century Game</h1>
          <p className="text-lg text-foreground/80 mt-2">Choose your game mode. First to hit the exact target score wins!</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
          {(Object.keys(CENTURY_MODES_CONFIG) as CenturyGameModeId[]).map((modeKey) => {
            const modeConfig = CENTURY_MODES_CONFIG[modeKey];
            const Icon = modeConfig.icon;
            return (
              <Button
                key={modeKey}
                onClick={() => initializeGame(modeKey)}
                size="lg"
                variant="outline"
                className="w-full py-6 text-lg border-primary text-primary hover:bg-primary/10"
              >
                <Icon className="mr-2 h-6 w-6" /> {modeConfig.label}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-2 sm:p-4 md:p-8 bg-background font-body">
      <div className="w-full max-w-5xl mb-4 self-start">
        <Link href="/" passHref>
          <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      <header className="mb-4 sm:mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline text-primary">
          Century
        </h1>
        <p className="text-lg text-foreground/80 mt-2">
          {currentModeConfig.label}. Target: <strong className="text-accent">{currentModeConfig.targetScore}</strong>.
          {currentModeConfig.isTeamGame ? " First team to hit exactly wins!" : " First player to hit exactly wins!"}
        </p>
      </header>

      <main className="w-full max-w-5xl bg-card/10 p-2 sm:p-4 md:p-6 rounded-xl shadow-2xl">

        {currentModeConfig.isTeamGame && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-center">
            <Card className={cn("bg-primary/10", scoreUpdateForTeam === 'A' ? "ring-2 ring-accent score-updated" : "")}>
              <CardHeader><CardTitle className="text-2xl text-primary">Team A Total</CardTitle></CardHeader>
              <CardContent><p className="text-4xl font-bold text-accent">{teamAScore}</p></CardContent>
            </Card>
            <Card className={cn("bg-primary/10", scoreUpdateForTeam === 'B' ? "ring-2 ring-accent score-updated" : "")}>
              <CardHeader><CardTitle className="text-2xl text-primary">Team B Total</CardTitle></CardHeader>
              <CardContent><p className="text-4xl font-bold text-accent">{teamBScore}</p></CardContent>
            </Card>
          </div>
        )}

        <div className={`grid ${getPlayerGridCols()} gap-2 sm:gap-4 items-start mb-4 sm:mb-6`}>
            {players.map((player, index) => (
                 <div key={player.id} className={
                     currentModeConfig && currentModeConfig.numTotalPlayers === 3 && index === 2 && !currentModeConfig.isTeamGame ? 'md:col-span-3 md:mx-auto md:w-1/3' : ''
                 }>
                    <PlayerScoreDisplay
                    player={player}
                    mainScore={player.score}
                    isActive={currentPlayerIndex === index && !winner}
                    isSinglesMode={!currentModeConfig.isTeamGame} // For styling purposes of PlayerScoreDisplay
                    scoreJustUpdated={scoreUpdateForPlayer === player.id}
                    onPlayerNameChange={handlePlayerNameChange}
                    showHighestBreak={false} // Century mode doesn't track highest break
                    showCurrentBreakInfo={false} // Century mode doesn't have a separate "current break"
                    teamId={player.teamId} // Pass teamId for display
                    isTeamGameContext={currentModeConfig.isTeamGame} // To show teamId in display
                    />
                 </div>
            ))}
        </div>

        {showWinnerPopup && winner && currentModeConfig && (
          <CenturyWinnerPopup
            winnerName={typeof winner === 'string' ? winner : (winner.name || `Player ${winner.id}`)}
            targetScore={currentModeConfig.targetScore}
            players={players} // Pass all players to display final scores
            onNewGame={handleNewGame}
          />
        )}

        {!winner && activePlayer && (
          <>
            <Separator className="my-4 sm:my-6 bg-primary/30" />
            <div className="text-center mb-4">
                <p className="text-xl font-semibold text-accent">
                    <UserCircle className="inline-block mr-2 h-6 w-6 align-middle" />
                    Current Player: {activePlayer.name || `Player ${activePlayer.id}`}
                    {activePlayer.teamId && ` (Team ${activePlayer.teamId})`}
                </p>
                 <p className="text-md text-foreground/80">
                   Individual Score: {activePlayer.score}
                   {currentModeConfig.isTeamGame && activePlayer.teamId && (
                     ` / Team ${activePlayer.teamId} Total: ${activePlayer.teamId === 'A' ? teamAScore : teamBScore} / ${currentModeConfig.targetScore}`
                   )}
                   {!currentModeConfig.isTeamGame && ` / ${currentModeConfig.targetScore}`}
                 </p>
            </div>

            <div className="p-2 sm:p-4 bg-secondary/50 rounded-lg shadow-inner">
              <h3 className="text-xl font-semibold text-primary mb-3 text-center">Record Action</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 justify-items-center">
                {CENTURY_BALLS.map((ball) => (
                  <div key={ball.name} className="flex flex-col items-center space-y-1">
                    <BallButton
                      ball={ball}
                      onClick={() => handlePot(ball)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2 border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeduct(ball)}
                      aria-label={`Deduct ${ball.name} (${ball.value} points)`}
                    >
                      <MinusCircle className="w-3 h-3 mr-1" /> Deduct {ball.value}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-4 sm:my-6 bg-primary/30" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 my-4">
              <Button
                variant="destructive"
                className="w-full text-sm sm:text-base py-3"
                onClick={handleFoul}
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                Foul ({activePlayer.name || `Player ${activePlayer.id}`} -{CENTURY_FOUL_POINTS} pts{currentModeConfig.numTotalPlayers > 1 ? " & End Turn" : ""})
              </Button>
              <Button
                variant="outline"
                className="w-full text-sm sm:text-base py-3 border-primary text-primary hover:bg-primary/10"
                onClick={handleEndTurn}
                disabled={currentModeConfig.numTotalPlayers <= 1}
              >
                <ArrowRightCircle className="w-5 h-5 mr-2" />
                End Turn / Miss
              </Button>
              <Button
                variant="secondary"
                className="w-full text-sm sm:text-base py-3"
                onClick={handleResetPlayerScore}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset Player's Score
              </Button>
            </div>
          </>
        )}

        <Separator className="my-4 sm:my-6 bg-primary/30" />

        <Button variant="outline" onClick={handleNewGame} className="w-full mt-4 py-3 bg-background hover:bg-accent/10">
            <Home className="mr-2 h-5 w-5" /> Change Mode / New Century Game
        </Button>
      </main>
    </div>
  );
}
