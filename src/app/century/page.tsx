
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import BallButton from '@/components/snooker/BallButton';
import PlayerScoreDisplay from '@/components/snooker/PlayerScore';
import CenturyWinnerPopup from '@/components/century/CenturyWinnerPopup';
import CenturyHistoryDisplay from '@/components/century/CenturyHistoryDisplay';
import type { Player, Ball, CenturyGameModeId, CenturyModeConfig, CenturyStoredState, CenturyEvent, CenturyPotEvent, CenturyDeductEvent, CenturyFoulPenaltyEvent, CenturyResetScoreEvent, CenturyTurnChangeEvent, CenturyGameStartEvent, CenturyGameEndEvent, CenturyActionSnapshot } from '@/types/snooker';
import { CENTURY_BALLS, CENTURY_FOUL_POINTS } from '@/types/snooker';
import { useToast } from '@/hooks/use-toast';
import { Home, RotateCcw, AlertTriangle, MinusCircle, ArrowRightCircle, UserCircle, ArrowLeft, Users, SquareUserRound, UsersRound, CheckSquare, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";


const LOCAL_STORAGE_KEY_CENTURY = 'centuryGameState';

const createInitialPlayer = (id: number, name: string, teamId?: 'A' | 'B'): Player => ({
  id,
  name: name, // Name starts empty to show placeholder
  score: 0,
  highestBreak: 0,
  teamId,
});

const CENTURY_MODES_CONFIG: Record<CenturyGameModeId, CenturyModeConfig> = {
  'singles-2': { id: 'singles-2', numTotalPlayers: 2, isTeamGame: false, targetScore: 100, label: "Singles (2 Players)", icon: UserCircle },
  'singles-3': { id: 'singles-3', numTotalPlayers: 3, isTeamGame: false, targetScore: 100, label: "Singles (3 Players)", icon: UserCircle },
  'singles-4': { id: 'singles-4', numTotalPlayers: 4, isTeamGame: false, targetScore: 100, label: "Singles (4 Players)", icon: UserCircle },
  'singles-5': { id: 'singles-5', numTotalPlayers: 5, isTeamGame: false, targetScore: 100, label: "Singles (5 Players)", icon: UserCircle },
  'singles-6': { id: 'singles-6', numTotalPlayers: 6, isTeamGame: false, targetScore: 100, label: "Singles (6 Players)", icon: UserCircle },
  'singles-7': { id: 'singles-7', numTotalPlayers: 7, isTeamGame: false, targetScore: 100, label: "Singles (7 Players)", icon: UserCircle },
  'singles-8': { id: 'singles-8', numTotalPlayers: 8, isTeamGame: false, targetScore: 100, label: "Singles (8 Players)", icon: UserCircle },
  doubles: { id: 'doubles', numTotalPlayers: 4, isTeamGame: true, playersPerTeam: 2, targetScore: 200, label: "Doubles (2v2)", icon: Users },
  triples: { id: 'triples', numTotalPlayers: 6, isTeamGame: true, playersPerTeam: 3, targetScore: 300, label: "Triples (3v3)", icon: UsersRound },
  quadruples: { id: 'quadruples', numTotalPlayers: 8, isTeamGame: true, playersPerTeam: 4, targetScore: 400, label: "Quadruples (4v4)", icon: SquareUserRound },
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
  const [winner, setWinner] = useState<Player | 'Team A' | 'Team B' | null | 'Draw'>(null);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const { toast } = useToast();
  const [scoreUpdateForPlayer, setScoreUpdateForPlayer] = useState<number | undefined>(undefined);
  const [scoreUpdateForTeam, setScoreUpdateForTeam] = useState<'A' | 'B' | undefined>(undefined);
  const [toastInfo, setToastInfo] = useState<ToastInfo | null>(null);
  const [frameHistory, setFrameHistory] = useState<CenturyEvent[]>([]);
  const [actionsHistory, setActionsHistory] = useState<CenturyActionSnapshot[]>([]);

  const [gameTypeSelection, setGameTypeSelection] = useState<'individual' | 'team' | null>(null);
  const [numPlayersIndividualSelection, setNumPlayersIndividualSelection] = useState<string | null>(null);
  const [teamTypeSelection, setTeamTypeSelection] = useState<CenturyGameModeId | null>(null);

  const activePlayer = players[currentPlayerIndex];
  const currentModeConfig = selectedModeId ? CENTURY_MODES_CONFIG[selectedModeId] : null;

  const getPlayerDisplayName = (player: Player | undefined): string => {
    if (!player) return "Unknown Player";
    return player.name || `Player ${player.id}`;
  };

  const addHistoryEvent = useCallback((eventData: Omit<CenturyEvent, 'timestamp'>) => {
    const newEvent = { ...eventData, timestamp: new Date().toISOString() } as CenturyEvent;
    setFrameHistory(prev => [...prev, newEvent]);
  }, []);

  const saveActionToHistory = useCallback(() => {
    if (winner) return; 

    const currentSnapshot: CenturyActionSnapshot = {
        selectedModeId,
        isGameInitialized,
        players: players.map(p => ({ ...p })), 
        teamAScore,
        teamBScore,
        currentPlayerIndex,
        winner,
        gameTypeSelection,
        numPlayersIndividualSelection,
        teamTypeSelection,
        frameHistory: frameHistory.map(e => ({...e})), 
    };
    setActionsHistory(prev => [...prev, currentSnapshot]);
  }, [selectedModeId, isGameInitialized, players, teamAScore, teamBScore, currentPlayerIndex, winner, gameTypeSelection, numPlayersIndividualSelection, teamTypeSelection, frameHistory]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGame = localStorage.getItem(LOCAL_STORAGE_KEY_CENTURY);
      if (savedGame) {
        try {
          const loadedState = JSON.parse(savedGame) as CenturyStoredState;
          if (loadedState && loadedState.selectedModeId && !loadedState.winner) { 
            setSelectedModeId(loadedState.selectedModeId);
            setIsGameInitialized(loadedState.isGameInitialized);
            setPlayers(loadedState.players);
            setTeamAScore(loadedState.teamAScore);
            setTeamBScore(loadedState.teamBScore);
            setCurrentPlayerIndex(loadedState.currentPlayerIndex);
            setWinner(loadedState.winner);
            setShowWinnerPopup(!!loadedState.winner);
            setFrameHistory(loadedState.frameHistory || []);
            setActionsHistory(loadedState.actionsHistory || []);
            if (loadedState.gameTypeSelection) setGameTypeSelection(loadedState.gameTypeSelection);
            if (loadedState.numPlayersIndividualSelection) setNumPlayersIndividualSelection(loadedState.numPlayersIndividualSelection);
            if (loadedState.teamTypeSelection) setTeamTypeSelection(loadedState.teamTypeSelection);
          } else if (loadedState && loadedState.winner) { 
            localStorage.removeItem(LOCAL_STORAGE_KEY_CENTURY);
          }
        } catch (error) {
          console.error("Failed to load century game state from localStorage:", error);
          localStorage.removeItem(LOCAL_STORAGE_KEY_CENTURY);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isGameInitialized && !winner) {
      const stateToSave: CenturyStoredState = {
        selectedModeId,
        isGameInitialized,
        players,
        teamAScore,
        teamBScore,
        currentPlayerIndex,
        winner,
        gameTypeSelection,
        numPlayersIndividualSelection,
        teamTypeSelection,
        frameHistory,
        actionsHistory,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_CENTURY, JSON.stringify(stateToSave));
    }
  }, [selectedModeId, isGameInitialized, players, teamAScore, teamBScore, currentPlayerIndex, winner, gameTypeSelection, numPlayersIndividualSelection, teamTypeSelection, frameHistory, actionsHistory]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isGameInitialized && winner) {
      localStorage.removeItem(LOCAL_STORAGE_KEY_CENTURY);
    }
  }, [winner, isGameInitialized]);


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

  const startGameFromSelections = () => {
    let modeIdToStart: CenturyGameModeId | null = null;

    if (gameTypeSelection === 'individual' && numPlayersIndividualSelection) {
      modeIdToStart = `singles-${numPlayersIndividualSelection}` as CenturyGameModeId;
    } else if (gameTypeSelection === 'team' && teamTypeSelection) {
      modeIdToStart = teamTypeSelection;
    }

    if (modeIdToStart && CENTURY_MODES_CONFIG[modeIdToStart]) {
      initializeGame(modeIdToStart);
    } else {
      setToastInfo({ title: "Mode Not Selected", description: "Please complete your game mode selection.", variant: "destructive"});
    }
  };

  const initializeGame = (modeId: CenturyGameModeId) => {
    const config = CENTURY_MODES_CONFIG[modeId];
    if (!config) {
        setToastInfo({ title: "Error", description: "Selected game mode is invalid.", variant: "destructive"});
        return;
    }
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
    setFrameHistory([]);
    setActionsHistory([]);
    addHistoryEvent({
        type: 'century_game_start',
        modeLabel: config.label,
        targetScore: config.targetScore,
        playerNames: initialPlayers.map(p => getPlayerDisplayName(p)),
    } as Omit<CenturyGameStartEvent, 'timestamp'>);
    setToastInfo({ title: `${config.label} Game Started`, description: `Target score: ${config.targetScore}. First to hit exactly wins.` });
  };

  const handlePlayerNameChange = (playerId: number, newName: string) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(p =>
        p.id === playerId ? { ...p, name: newName } : p
      )
    );
  };

  const processGameEnd = (gameWinner: Player | 'Team A' | 'Team B' | 'Draw') => {
    if (!currentModeConfig) return;
    setWinner(gameWinner);
    setShowWinnerPopup(true);

    let winnerNameStr = "";
    if (typeof gameWinner === 'string') {
        winnerNameStr = gameWinner;
    } else if (gameWinner) {
        winnerNameStr = getPlayerDisplayName(gameWinner);
    }

    const finalScores: { [key: string]: number } = {};
    if (currentModeConfig.isTeamGame) {
        finalScores['Team A'] = teamAScore;
        finalScores['Team B'] = teamBScore;
    } else {
        players.forEach(p => {
            finalScores[getPlayerDisplayName(p)] = p.score;
        });
    }

    addHistoryEvent({
        type: 'century_game_end',
        winnerName: winnerNameStr,
        finalScores,
        targetScore: currentModeConfig.targetScore
    } as Omit<CenturyGameEndEvent, 'timestamp'>);

    setToastInfo({ title: `${winnerNameStr} Wins!`, description: `Game ended. Target: ${currentModeConfig.targetScore}` });
};


  const updateScoresAndCheckWin = (playerIndex: number, pointsChange: number, actionType: 'pot' | 'deduct' | 'foul_penalty' | 'reset' = 'pot', ballPotted?: Ball) => {
    if (!currentModeConfig || winner) return;

    setPlayers(prevPlayers => {
      const playerBeforeUpdate = { ...prevPlayers[playerIndex] };
      const updatedPlayers = prevPlayers.map((p, idx) => {
        if (idx === playerIndex) {
          const newScore = p.score + pointsChange;
          return { ...p, score: newScore };
        }
        return p;
      });

      const playerAfterUpdate = updatedPlayers[playerIndex];

      let newTeamAScore = teamAScore;
      let newTeamBScore = teamBScore;
      let updatedTeamScoreForEvent: number | undefined;

      if (currentModeConfig.isTeamGame) {
        newTeamAScore = 0;
        newTeamBScore = 0;
        updatedPlayers.forEach(p => {
          if (p.teamId === 'A') newTeamAScore += p.score;
          else if (p.teamId === 'B') newTeamBScore += p.score;
        });
        setTeamAScore(newTeamAScore);
        setTeamBScore(newTeamBScore);
        if (playerAfterUpdate?.teamId === 'A') {
            setScoreUpdateForTeam('A');
            updatedTeamScoreForEvent = newTeamAScore;
        }
        if (playerAfterUpdate?.teamId === 'B') {
            setScoreUpdateForTeam('B');
            updatedTeamScoreForEvent = newTeamBScore;
        }
      } else {
         setScoreUpdateForPlayer(playerAfterUpdate.id);
      }

      const target = currentModeConfig.targetScore;
      const playerName = getPlayerDisplayName(playerAfterUpdate);
      let localToastTitle = "";
      let localToastDescription = "";
      let localToastVariant: "destructive" | "default" | undefined = undefined;

      const scoreAfterChange = playerAfterUpdate.score;

      if (actionType === 'pot' && ballPotted) {
          localToastTitle = `${playerName} scored!`;
          localToastDescription = `+${pointsChange} points. New Score: ${scoreAfterChange}`;
          addHistoryEvent({ type: 'century_pot', playerId: playerAfterUpdate.id, ball: ballPotted, newPlayerScore: scoreAfterChange, newTeamScore: updatedTeamScoreForEvent } as Omit<CenturyPotEvent, 'timestamp'>);
      } else if (actionType === 'deduct' && ballPotted) {
          localToastTitle = `${playerName} deducted points!`;
          localToastDescription = `${pointsChange} points. New Score: ${scoreAfterChange}`;
          localToastVariant = "destructive";
          addHistoryEvent({ type: 'century_deduct', playerId: playerAfterUpdate.id, ball: ballPotted, newPlayerScore: scoreAfterChange, newTeamScore: updatedTeamScoreForEvent } as Omit<CenturyDeductEvent, 'timestamp'>);
      } else if (actionType === 'foul_penalty') {
            localToastTitle = `Foul by ${playerName}!`;
            localToastDescription = `${pointsChange} points deducted. New Score: ${scoreAfterChange}`;
            localToastVariant = "destructive";
            addHistoryEvent({ type: 'century_foul_penalty', playerId: playerAfterUpdate.id, pointsDeducted: -pointsChange, newPlayerScore: scoreAfterChange, newTeamScore: updatedTeamScoreForEvent } as Omit<CenturyFoulPenaltyEvent, 'timestamp'>);
      } else if (actionType === 'reset') {
          localToastTitle = `${playerName}'s Score Reset`;
          localToastDescription = `Score is now ${scoreAfterChange}.`;
          const previousTeamScore = playerBeforeUpdate.teamId === 'A' ? teamAScore : (playerBeforeUpdate.teamId === 'B' ? teamBScore : undefined);
          addHistoryEvent({ type: 'century_reset_score', playerId: playerAfterUpdate.id, previousPlayerScore: playerBeforeUpdate.score, newPlayerScore: scoreAfterChange, previousTeamScore, newTeamScore: updatedTeamScoreForEvent } as Omit<CenturyResetScoreEvent, 'timestamp'>);
      }

      if (localToastTitle) {
        setToastInfo({ title: localToastTitle, description: localToastDescription, variant: localToastVariant });
      }


      if (!winner) {
          if (currentModeConfig.isTeamGame) {
            const currentTeamId = playerAfterUpdate.teamId;
            const currentTeamScore = currentTeamId === 'A' ? newTeamAScore : newTeamBScore;
            const teamIdentifier = `Team ${currentTeamId}` as 'Team A' | 'Team B';

            if (currentTeamScore === target) {
              processGameEnd(teamIdentifier);
            } else if (currentTeamScore > target) {
              setToastInfo({ title: "Team Overshot!", description: `${teamIdentifier}'s score is ${currentTeamScore}. Must hit ${target} exactly.`, variant: "destructive" });
            }
          } else {
            if (scoreAfterChange === target) {
              processGameEnd(playerAfterUpdate);
            } else if (scoreAfterChange > target) {
              setToastInfo({ title: "Overshot!", description: `${playerName}'s score is ${scoreAfterChange}. Must hit ${target} exactly.`, variant: "destructive" });
            }
          }
      }
      return updatedPlayers;
    });
  };


  const handlePot = (ball: Ball) => {
    if (!activePlayer || winner) return;
    saveActionToHistory();
    updateScoresAndCheckWin(currentPlayerIndex, ball.value, 'pot', ball);
  };

  const handleDeduct = (ball: Ball) => {
    if (!activePlayer || winner || !currentModeConfig) return;
    saveActionToHistory();
    updateScoresAndCheckWin(currentPlayerIndex, -ball.value, 'deduct', ball);
    if (!winner && currentModeConfig.numTotalPlayers > 1) {
        handleEndTurn(); // End turn after deduction if multiple players
    }
  };

  const handleFoul = () => {
    if (winner || !activePlayer || !currentModeConfig) return;
    saveActionToHistory();
    const foulingPlayer = players[currentPlayerIndex];
    updateScoresAndCheckWin(currentPlayerIndex, -CENTURY_FOUL_POINTS, 'foul_penalty');

    if (!winner && currentModeConfig.numTotalPlayers > 1) {
      const nextPlayerIdx = (currentPlayerIndex + 1) % players.length;
      const nextPlayer = players[nextPlayerIdx];
      addHistoryEvent({ type: 'century_turn_change', previousPlayerId: foulingPlayer.id, nextPlayerId: nextPlayer.id } as Omit<CenturyTurnChangeEvent, 'timestamp'>);
      setCurrentPlayerIndex(nextPlayerIdx);
      setToastInfo({
          title: `Turn switched to ${getPlayerDisplayName(nextPlayer)}`,
          description: `${getPlayerDisplayName(foulingPlayer)} fouled. Score updated. It's now ${getPlayerDisplayName(nextPlayer)}'s turn.`,
        });
    }
  };

  const handleEndTurn = () => {
    if (winner || !currentModeConfig || currentModeConfig.numTotalPlayers <= 1 || !activePlayer) return;
    saveActionToHistory();
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayer = players[nextPlayerIndex];
    addHistoryEvent({ type: 'century_turn_change', previousPlayerId: activePlayer.id, nextPlayerId: nextPlayer.id } as Omit<CenturyTurnChangeEvent, 'timestamp'>);
    setToastInfo({
      title: `Turn Ended for ${getPlayerDisplayName(activePlayer)}`,
      description: `It's now ${getPlayerDisplayName(nextPlayer)}'s turn.`,
    });
    setCurrentPlayerIndex(nextPlayerIndex);
  };

  const handleResetPlayerScore = () => {
    if (!activePlayer || winner) return;
    saveActionToHistory();
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
    setGameTypeSelection(null);
    setNumPlayersIndividualSelection(null);
    setTeamTypeSelection(null);
    setFrameHistory([]);
    setActionsHistory([]);
    if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEY_CENTURY);
    }
  };

 const handleEndGameManually = useCallback(() => {
    if (winner || !currentModeConfig) return;
    saveActionToHistory(); 

    let gameWinner: Player | 'Team A' | 'Team B' | 'Draw' = 'Draw';

    if (currentModeConfig.isTeamGame) {
        if (teamAScore > teamBScore) gameWinner = 'Team A';
        else if (teamBScore > teamAScore) gameWinner = 'Team B';

    } else {
        let maxScore = -1;
        let winningPlayers: Player[] = [];
        players.forEach(p => {
            if (p.score > maxScore) {
                maxScore = p.score;
                winningPlayers = [p];
            } else if (p.score === maxScore) {
                winningPlayers.push(p);
            }
        });

        if (winningPlayers.length === 1 && maxScore >= 0) {
            gameWinner = winningPlayers[0];
        } else if (winningPlayers.length > 1) {
            gameWinner = 'Draw';
        }
    }
    processGameEnd(gameWinner);
  }, [players, teamAScore, teamBScore, currentModeConfig, winner, addHistoryEvent, saveActionToHistory]);


  const handleUndoShotCentury = () => {
    if (actionsHistory.length === 0 || winner) return;

    const lastState = actionsHistory[actionsHistory.length - 1];

    setSelectedModeId(lastState.selectedModeId);
    setPlayers(lastState.players.map(p => ({ ...p }))); 
    setTeamAScore(lastState.teamAScore);
    setTeamBScore(lastState.teamBScore);
    setCurrentPlayerIndex(lastState.currentPlayerIndex);
    setWinner(lastState.winner);
    setShowWinnerPopup(!!lastState.winner);
    setGameTypeSelection(lastState.gameTypeSelection ?? null);
    setNumPlayersIndividualSelection(lastState.numPlayersIndividualSelection ?? null);
    setTeamTypeSelection(lastState.teamTypeSelection ?? null);
    setFrameHistory(lastState.frameHistory.map(e => ({ ...e }))); 

    setActionsHistory(prev => prev.slice(0, -1));
    setToastInfo({ title: "Undo Successful", description: "Last action reverted." });
  };


 const getPlayerGridCols = () => {
    if (!currentModeConfig) return 'grid-cols-1 sm:grid-cols-1';

    const { numTotalPlayers, isTeamGame } = currentModeConfig;

    if (isTeamGame) {
        if (numTotalPlayers === 4) return 'grid-cols-1 sm:grid-cols-2';
        if (numTotalPlayers === 6) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
        if (numTotalPlayers === 8) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
    } else {
        switch (numTotalPlayers) {
            case 2:
                return 'grid-cols-1 sm:grid-cols-2';
            case 3:
                return 'grid-cols-1 sm:grid-cols-3';
            case 4:
                return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
            case 5:
                return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
            case 6:
                return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
            case 7:
                return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
            case 8:
                return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
            default:
                return 'grid-cols-1 sm:grid-cols-2';
        }
    }
    return 'grid-cols-1 sm:grid-cols-1';
};


  if (!isGameInitialized || !currentModeConfig) {
    return (
      <div className="min-h-screen flex flex-col p-4 bg-background font-body">
        <div className="flex-grow flex flex-col items-center justify-center">
          <div className="w-full max-w-3xl mb-4 self-start">
          <Link href="/" passHref>
              <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          <header className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">Century Game Setup</h1>
            <p className="text-lg text-foreground/80 mt-2">Configure your game. First to hit the exact target score wins!</p>
          </header>

          <Card className="w-full max-w-md p-6 shadow-xl bg-card/20">
              <CardContent className="space-y-6">
                  <div>
                      <Label htmlFor="gameType" className="text-lg font-semibold text-primary">1. Select Game Type</Label>
                      <RadioGroup
                          id="gameType"
                          value={gameTypeSelection || ""}
                          onValueChange={(value) => {
                              setGameTypeSelection(value as 'individual' | 'team');
                              setNumPlayersIndividualSelection(null);
                              setTeamTypeSelection(null);
                          }}
                          className="flex space-x-4 mt-2"
                      >
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="individual" id="individual" />
                              <Label htmlFor="individual" className="text-md">Individual</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="team" id="team" />
                              <Label htmlFor="team" className="text-md">Team Game</Label>
                          </div>
                      </RadioGroup>
                  </div>

                  {gameTypeSelection === 'individual' && (
                      <div>
                          <Label htmlFor="numPlayers" className="text-lg font-semibold text-primary">2. Select Number of Players</Label>
                          <Select
                              value={numPlayersIndividualSelection || ""}
                              onValueChange={(value) => setNumPlayersIndividualSelection(value)}
                          >
                              <SelectTrigger id="numPlayers" className="w-full mt-2">
                                  <SelectValue placeholder="Select players..." />
                              </SelectTrigger>
                              <SelectContent>
                                  {[2, 3, 4, 5, 6, 7, 8].map(num => (
                                      <SelectItem key={num} value={String(num)}>{num} Players</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                  )}

                  {gameTypeSelection === 'team' && (
                      <div>
                          <Label htmlFor="teamMode" className="text-lg font-semibold text-primary">2. Select Team Mode</Label>
                          <Select
                              value={teamTypeSelection || ""}
                              onValueChange={(value) => setTeamTypeSelection(value as CenturyGameModeId)}
                          >
                              <SelectTrigger id="teamMode" className="w-full mt-2">
                                  <SelectValue placeholder="Select team mode..." />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="doubles">{CENTURY_MODES_CONFIG.doubles.label} (Target {CENTURY_MODES_CONFIG.doubles.targetScore})</SelectItem>
                                  <SelectItem value="triples">{CENTURY_MODES_CONFIG.triples.label} (Target {CENTURY_MODES_CONFIG.triples.targetScore})</SelectItem>
                                  <SelectItem value="quadruples">{CENTURY_MODES_CONFIG.quadruples.label} (Target {CENTURY_MODES_CONFIG.quadruples.targetScore})</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  )}

                  <Button
                      onClick={startGameFromSelections}
                      size="lg"
                      className="w-full mt-6 py-3 text-lg"
                      disabled={!gameTypeSelection || (gameTypeSelection === 'individual' && !numPlayersIndividualSelection) || (gameTypeSelection === 'team' && !teamTypeSelection)}
                  >
                      Start Game
                  </Button>
              </CardContent>
          </Card>
        </div>
        <footer className="text-center text-xs sm:text-sm text-muted-foreground py-4">
           <p>&copy; {new Date().getFullYear()} Cue Sports Scorekeeper. Built by Arvinder.</p>
        </footer>
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

      <main className="w-full max-w-5xl bg-card/10 p-2 sm:p-4 md:p-6 rounded-xl shadow-2xl flex-grow">

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
                     currentModeConfig && currentModeConfig.numTotalPlayers === 3 && index === 2 && !currentModeConfig.isTeamGame ? 'sm:col-span-2 md:col-span-3 md:mx-auto md:w-1/3' :
                     (currentModeConfig && currentModeConfig.numTotalPlayers === 5 && index >= 3 && !currentModeConfig.isTeamGame ? (index === 3 ? 'sm:col-span-1 md:col-start-2' : 'sm:col-span-1') :
                     (currentModeConfig && currentModeConfig.numTotalPlayers === 7 && index >=3 && !currentModeConfig.isTeamGame ?
                        (index === 3 ? 'sm:col-start-2 md:col-start-2' :
                         index === 4 ? 'sm:col-start-1 md:col-start-1 lg:col-start-2' :
                         index === 5 ? 'sm:col-start-auto md:col-start-auto lg:col-start-3':
                         '' )
                        : ''))
                 }>
                    <PlayerScoreDisplay
                    player={player}
                    mainScore={player.score}
                    isActive={currentPlayerIndex === index && !winner}
                    isSinglesMode={!currentModeConfig.isTeamGame}
                    scoreJustUpdated={scoreUpdateForPlayer === player.id || (currentModeConfig.isTeamGame && scoreUpdateForTeam === player.teamId)}
                    onPlayerNameChange={handlePlayerNameChange}
                    showHighestBreak={false}
                    showCurrentBreakInfo={false}
                    teamId={player.teamId}
                    isTeamGameContext={currentModeConfig.isTeamGame}
                    />
                 </div>
            ))}
        </div>

        {showWinnerPopup && winner && currentModeConfig && (
          <CenturyWinnerPopup
            winnerName={typeof winner === 'string' ? winner : (getPlayerDisplayName(winner))}
            targetScore={currentModeConfig.targetScore}
            players={players}
            onNewGame={handleNewGame}
            isTeamGame={currentModeConfig.isTeamGame}
            teamAScore={teamAScore}
            teamBScore={teamBScore}
          />
        )}

        {!winner && activePlayer && (
          <>
            <Separator className="my-4 sm:my-6 bg-primary/30" />
            <div className="text-center mb-4">
                <p className="text-xl font-semibold text-accent">
                    <UserCircle className="inline-block mr-2 h-6 w-6 align-middle" />
                    Current Player: {getPlayerDisplayName(activePlayer)}
                    {activePlayer.teamId && ` (Team ${activePlayer.teamId})`}
                </p>
                 <p className="text-md text-foreground/80">
                   Individual Score: {activePlayer.score}
                   {currentModeConfig.isTeamGame && activePlayer.teamId && (
                     ` / Team ${activePlayer.teamId} Total: ${activePlayer.teamId === 'A' ? teamAScore : teamBScore} / Target: ${currentModeConfig.targetScore}`
                   )}
                   {!currentModeConfig.isTeamGame && ` / Target: ${currentModeConfig.targetScore}`}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 my-4">
              <Button
                variant="destructive"
                className="w-full text-sm sm:text-base py-3"
                onClick={handleFoul}
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                Foul (-{CENTURY_FOUL_POINTS} pts{currentModeConfig.numTotalPlayers > 1 ? ", End Turn" : ""})
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
              <Button
                variant="outline"
                onClick={handleUndoShotCentury}
                disabled={actionsHistory.length === 0 || !!winner}
                className="w-full text-sm sm:text-base py-3"
              >
                <Undo2 className="w-5 h-5 mr-2" />
                Undo Last Action
              </Button>
              <Button
                variant="default"
                className="w-full text-sm sm:text-base py-3 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleEndGameManually}
                disabled={!!winner}
              >
                <CheckSquare className="w-5 h-5 mr-2" />
                End Game Manually
              </Button>
            </div>
          </>
        )}

        <Separator className="my-4 sm:my-6 bg-primary/30" />

        <CenturyHistoryDisplay frameHistory={frameHistory} players={players} currentModeConfig={currentModeConfig} />

        <Separator className="my-4 sm:my-6 bg-primary/30" />

        <Button variant="outline" onClick={handleNewGame} className="w-full mt-4 py-3 bg-background hover:bg-accent/10">
            <Home className="mr-2 h-5 w-5" /> Change Mode / New Century Game
        </Button>
      </main>

      <footer className="py-4 text-center text-xs sm:text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Cue Sports Scorekeeper. Built by Arvinder.</p>
      </footer>
    </div>
  );
}
