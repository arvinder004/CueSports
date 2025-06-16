
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import BallButton from '@/components/snooker/BallButton';
// PlayerScoreDisplay is no longer used directly for the list in active game, but parts of its logic/props are relevant for individual player items
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
import { Input } from '@/components/ui/input';


const LOCAL_STORAGE_KEY_CENTURY = 'centuryGameState';

const createInitialPlayer = (id: number, name: string, teamId?: 'A' | 'B'): Player => ({
  id,
  name: name, 
  score: 0,
  highestBreak: 0, // Not used in Century display but part of Player type
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
  const [scoreUpdateForPlayerId, setScoreUpdateForPlayerId] = useState<number | undefined>(undefined);
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
    if (scoreUpdateForPlayerId !== undefined) {
      const timer = setTimeout(() => setScoreUpdateForPlayerId(undefined), 300);
      return () => clearTimeout(timer);
    }
  }, [scoreUpdateForPlayerId]);

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
         setScoreUpdateForPlayerId(playerAfterUpdate.id);
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
        handleEndTurn(); 
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
  }, [players, teamAScore, teamBScore, currentModeConfig, winner, addHistoryEvent, saveActionToHistory, processGameEnd]);


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
    <div className="min-h-screen flex flex-col items-center p-2 sm:p-4 bg-background font-body">
      <div className="w-full max-w-lg mb-4 self-start">
        <Link href="/" passHref>
          <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      <main className="w-full max-w-lg bg-card/10 p-3 sm:p-4 rounded-xl shadow-2xl flex-grow flex flex-col">
        <div className="bg-card text-card-foreground p-3 rounded-lg mb-4 text-center shadow">
            <h1 className="text-xl sm:text-2xl font-bold font-headline">
            Century - {currentModeConfig.label}
            </h1>
            <p className="text-sm sm:text-base text-card-foreground/80">
            Target: <strong className="text-accent-foreground">{currentModeConfig.targetScore}</strong>
            </p>
        </div>

        {currentModeConfig.isTeamGame && (
          <div className="grid grid-cols-2 gap-3 mb-4 text-center">
            <Card className={cn("bg-primary/10 text-primary", scoreUpdateForTeam === 'A' ? "ring-2 ring-accent score-updated" : "")}>
              <CardHeader className="p-2"><CardTitle className="text-lg sm:text-xl">Team A</CardTitle></CardHeader>
              <CardContent className="p-2"><p className="text-2xl sm:text-3xl font-bold text-accent">{teamAScore}</p></CardContent>
            </Card>
            <Card className={cn("bg-primary/10 text-primary", scoreUpdateForTeam === 'B' ? "ring-2 ring-accent score-updated" : "")}>
              <CardHeader className="p-2"><CardTitle className="text-lg sm:text-xl">Team B</CardTitle></CardHeader>
              <CardContent className="p-2"><p className="text-2xl sm:text-3xl font-bold text-accent">{teamBScore}</p></CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-2 mb-4">
            {players.map((player, index) => (
                <div 
                    key={player.id} 
                    className={cn(
                        "flex justify-between items-center p-2 sm:p-3 rounded-md shadow",
                        currentPlayerIndex === index && !winner ? "bg-accent/20 ring-2 ring-accent" : "bg-card/50",
                        scoreUpdateForPlayerId === player.id || (currentModeConfig.isTeamGame && scoreUpdateForTeam === player.teamId && currentPlayerIndex === index) ? "score-updated" : ""
                    )}
                >
                    <Input
                        type="text"
                        value={player.name}
                        onChange={(e) => handlePlayerNameChange(player.id, e.target.value)}
                        placeholder={currentModeConfig.isTeamGame ? `Player ${player.id} (Team ${player.teamId})` : `Player ${player.id} Name`}
                        className={cn(
                            "text-sm sm:text-base bg-transparent border-0 focus:ring-0 flex-grow mr-2",
                            currentPlayerIndex === index && !winner ? "text-accent-foreground placeholder:text-accent-foreground/70" : "text-foreground placeholder:text-foreground/70"
                        )}
                        aria-label={`Player ${player.id} Name Input`}
                        disabled={!!winner}
                    />
                    <span className={cn(
                        "text-lg sm:text-xl font-bold",
                        currentPlayerIndex === index && !winner ? "text-accent-foreground" : "text-foreground"
                    )}>
                        {player.score}
                    </span>
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
            <p className="text-center text-sm text-muted-foreground mb-3">
                Current: {getPlayerDisplayName(activePlayer)}
                {activePlayer.teamId && ` (Team ${activePlayer.teamId})`}
            </p>

            <div className="p-3 sm:p-4 bg-secondary/30 rounded-lg shadow-inner mb-4">
              <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-3 justify-items-center">
                {CENTURY_BALLS.map((ball) => (
                  <div key={ball.name} className="flex flex-col items-center space-y-1 w-full">
                    <BallButton
                      ball={ball}
                      onClick={() => handlePot(ball)}
                      // Make BallButton smaller if needed for this layout via props or new component variant
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-1 sm:px-2 w-full border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeduct(ball)}
                      aria-label={`Deduct ${ball.name}`}
                    >
                      <MinusCircle className="w-3 h-3 mr-1 hidden sm:inline" />Deduct {ball.value}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
              <Button
                variant="destructive"
                className="w-full text-sm py-2 sm:py-3"
                onClick={handleFoul}
              >
                <AlertTriangle className="w-4 h-4 mr-1 sm:mr-2" />
                Foul (-{CENTURY_FOUL_POINTS})
              </Button>
              <Button
                variant="outline"
                className="w-full text-sm py-2 sm:py-3 border-primary text-primary hover:bg-primary/10"
                onClick={handleEndTurn}
                disabled={currentModeConfig.numTotalPlayers <= 1}
              >
                <ArrowRightCircle className="w-4 h-4 mr-1 sm:mr-2" />
                End Turn
              </Button>
              <Button
                variant="secondary"
                className="w-full text-sm py-2 sm:py-3"
                onClick={handleResetPlayerScore}
              >
                <RotateCcw className="w-4 h-4 mr-1 sm:mr-2" />
                Reset Score
              </Button>
              <Button
                variant="outline"
                onClick={handleUndoShotCentury}
                disabled={actionsHistory.length === 0 || !!winner}
                className="w-full text-sm py-2 sm:py-3"
              >
                <Undo2 className="w-4 h-4 mr-1 sm:mr-2" />
                Undo
              </Button>
            </div>
             <Button
                variant="default"
                className="w-full text-sm sm:text-base py-3 bg-primary text-primary-foreground hover:bg-primary/90 mb-4"
                onClick={handleEndGameManually}
                disabled={!!winner}
              >
                <CheckSquare className="w-5 h-5 mr-2" />
                End Game
              </Button>
          </>
        )}
        
        <div className="mt-auto"> {/* Pushes history and new game button down */}
            <Separator className="my-4 bg-primary/30" />
            <CenturyHistoryDisplay frameHistory={frameHistory} players={players} currentModeConfig={currentModeConfig} />
            <Separator className="my-4 bg-primary/30" />
            <Button variant="outline" onClick={handleNewGame} className="w-full py-3 bg-background hover:bg-accent/10">
                <Home className="mr-2 h-5 w-5" /> Change Mode / New Century Game
            </Button>
        </div>
      </main>

      <footer className="py-4 text-center text-xs sm:text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Cue Sports Scorekeeper. Built by Arvinder.</p>
      </footer>
    </div>
  );
}

