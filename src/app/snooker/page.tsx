
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { GameState, Player, Ball, FrameEvent, BreakCompletedEvent, FoulEvent, MissEvent, FrameStartEvent, FrameEndEvent } from '@/types/snooker';
import { SNOOKER_BALLS, FOUL_POINTS } from '@/types/snooker';
import TeamScoreDisplay from '@/components/snooker/TeamScoreDisplay';
import PlayerScoreDisplay from '@/components/snooker/PlayerScore';
import ScoreControls from '@/components/snooker/ScoreControls';
import GameActions from '@/components/snooker/GameActions';
import WinnerPopup from '@/components/snooker/WinnerPopup';
import BreakHistoryDisplay from '@/components/snooker/BreakHistoryDisplay';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Users, User, Home, ArrowLeft } from 'lucide-react';

const LOCAL_STORAGE_KEY_SNOOKER = 'snookerGameState';

const initialPlayer = (id: number, name: string, teamId?: 'A' | 'B'): Player => ({
  id,
  name,
  score: 0,
  highestBreak: 0,
  teamId,
});

const createInitialGameState = (mode: 'singles' | 'doubles' | null): GameState => {
  let players: Player[] = [];
  let playerFrameScores: [number, number] | undefined = undefined;
  let teamAScore: number | undefined = undefined;
  let teamBScore: number | undefined = undefined;

  if (mode === 'singles') {
    players = [
      initialPlayer(1, '', 'A'),
      initialPlayer(2, '', 'B'),
    ];
    playerFrameScores = [0, 0];
  } else if (mode === 'doubles') {
    players = [
      initialPlayer(1, '', 'A'),
      initialPlayer(2, '', 'B'),
      initialPlayer(3, '', 'A'),
      initialPlayer(4, '', 'B'),
    ];
    teamAScore = 0;
    teamBScore = 0;
  }

  return {
    gameMode: mode,
    players,
    playerFrameScores,
    teamAScore,
    teamBScore,
    currentPlayerIndex: 0,
    currentBreak: 0,
    redsRemaining: 15,
    gamePhase: 'reds_and_colors',
    lastPotWasRed: false,
    nextColorInSequence: 'Yellow',
    shotsHistory: [],
    winnerIdentifier: null,
    scoreUpdateFor: undefined,
    currentBreakPots: [],
    frameHistory: mode ? [{ type: 'frame_start', gameMode: mode, playerNames: players.map(p=>p.name || `Player ${p.id}`), timestamp: new Date().toISOString() } as FrameStartEvent] : [],
  };
};

export default function SnookerPage() {
  const [gameMode, setGameMode] = useState<'singles' | 'doubles' | null>(null);
  const [isGameInitialized, setIsGameInitialized] = useState(false);
  const [gameState, setGameState] = useState<GameState>(createInitialGameState(null));
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGame = localStorage.getItem(LOCAL_STORAGE_KEY_SNOOKER);
      if (savedGame) {
        try {
          const loadedState = JSON.parse(savedGame) as GameState;
          if (loadedState && loadedState.gameMode) {
            setGameState(loadedState);
            setIsGameInitialized(true);
            setGameMode(loadedState.gameMode);
          }
        } catch (error) {
          console.error("Failed to load snooker game state from localStorage:", error);
          localStorage.removeItem(LOCAL_STORAGE_KEY_SNOOKER);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isGameInitialized) {
      localStorage.setItem(LOCAL_STORAGE_KEY_SNOOKER, JSON.stringify(gameState));
    }
  }, [gameState, isGameInitialized]);


  const initializeGame = useCallback((mode: 'singles' | 'doubles') => {
    setGameMode(mode);
    const newGameState = createInitialGameState(mode);
    setGameState(newGameState);
    setIsGameInitialized(true);
    toast({ title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Game Started`, description: "Scores and breaks reset." });
  }, [toast]);


  const handlePlayerNameChange = (playerId: number, newName: string) => {
    setGameState(prev => {
      const newPlayers = prev.players.map(p =>
        p.id === playerId ? { ...p, name: newName } : p
      );

      let newFrameHistory = [...prev.frameHistory];
      const lastEvent = newFrameHistory[newFrameHistory.length -1];
      if (lastEvent && lastEvent.type === 'frame_start') {
        const updatedPlayerNames = newPlayers.map(p => getPlayerDisplayName(p));

        const lastFrameStartEventIndex = newFrameHistory.map(e => e.type).lastIndexOf('frame_start');
        if (lastFrameStartEventIndex !== -1) {
            newFrameHistory[lastFrameStartEventIndex] = {
                ...newFrameHistory[lastFrameStartEventIndex],
                playerNames: updatedPlayerNames,
            } as FrameStartEvent;
        }
      }

      return { ...prev, players: newPlayers, frameHistory: newFrameHistory };
    });
  };

  const getPlayerDisplayName = (player: Player | undefined): string => {
    if (!player) return "Unknown Player";
    return player.name || `Player ${player.id}`;
  }


  const resetScoreUpdateFlags = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      scoreUpdateFor: undefined,
    }));
  }, []);

  useEffect(() => {
    if (gameState.scoreUpdateFor) {
      const timer = setTimeout(resetScoreUpdateFlags, 300);
      return () => clearTimeout(timer);
    }
  }, [gameState.scoreUpdateFor, resetScoreUpdateFlags]);

  const saveToHistory = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      shotsHistory: [...prev.shotsHistory, { ...prev, shotsHistory: [] }],
    }));
  }, []);

  const handlePot = (ball: Ball) => {
    if (!gameState.gameMode || gameState.winnerIdentifier) return;
    saveToHistory();

    setGameState(prev => {
      if (!prev.gameMode || prev.winnerIdentifier) return prev;

      if (prev.gamePhase === 'colors_sequence' && ball.name !== 'Red' && ball.name !== prev.nextColorInSequence) {
        toast({
          title: "Wrong Ball",
          description: `Expected ${prev.nextColorInSequence}, but potted ${ball.name}. Pot ignored. Press Foul if applicable.`,
          variant: "destructive"
        });
        return prev;
      }

      const activePlayerIndex = prev.currentPlayerIndex;
      let newPlayers = prev.players.map((p, index) =>
        index === activePlayerIndex ? { ...p, score: p.score + ball.value } : { ...p }
      );

      let newPlayerFrameScores = prev.playerFrameScores ? [...prev.playerFrameScores] as [number,number] : undefined;
      let newTeamAScore = prev.teamAScore;
      let newTeamBScore = prev.teamBScore;
      let scoreUpdateTriggerKey: string | undefined = undefined;
      let gameWinnerIdentifier: string | null = null;
      let newFrameHistory = [...prev.frameHistory];
      const currentBreakPotsUpdate = [...prev.currentBreakPots, ball];

      if (prev.gameMode === 'singles' && newPlayerFrameScores) {
        newPlayerFrameScores[activePlayerIndex] += ball.value;
        if (ball.value > 0) scoreUpdateTriggerKey = `player${activePlayerIndex + 1}`;
      } else if (prev.gameMode === 'doubles') {
        const activePlayerTeamId = newPlayers[activePlayerIndex].teamId;
        if (activePlayerTeamId === 'A') {
          newTeamAScore = (newTeamAScore ?? 0) + ball.value;
          if (ball.value > 0) scoreUpdateTriggerKey = 'teamA';
        } else {
          newTeamBScore = (newTeamBScore ?? 0) + ball.value;
          if (ball.value > 0) scoreUpdateTriggerKey = 'teamB';
        }
      }

      let newRedsRemaining = prev.redsRemaining;
      let newGamePhase = prev.gamePhase;
      let newLastPotWasRed = prev.lastPotWasRed;
      let newNextColorInSequence = prev.nextColorInSequence;

      if (newGamePhase === 'reds_and_colors') {
        if (ball.name === 'Red') {
          newRedsRemaining--;
          newLastPotWasRed = true;
        } else {
          newLastPotWasRed = false;
          if (prev.redsRemaining === 0) {
            newGamePhase = 'colors_sequence';
            newNextColorInSequence = 'Yellow';
          }
        }
      } else {
        if (ball.name === 'Yellow') newNextColorInSequence = 'Green';
        else if (ball.name === 'Green') newNextColorInSequence = 'Brown';
        else if (ball.name === 'Brown') newNextColorInSequence = 'Blue';
        else if (ball.name === 'Blue') newNextColorInSequence = 'Pink';
        else if (ball.name === 'Pink') newNextColorInSequence = 'Black';
        else if (ball.name === 'Black') {

          const finalBreakScore = newPlayers[activePlayerIndex].score;
          newPlayers[activePlayerIndex] = {
            ...newPlayers[activePlayerIndex],
            highestBreak: Math.max(newPlayers[activePlayerIndex].highestBreak, finalBreakScore),
          };

          newFrameHistory.push({
            type: 'break_completed',
            playerId: newPlayers[activePlayerIndex].id,
            ballsPotted: [...currentBreakPotsUpdate],
            points: finalBreakScore,
            timestamp: new Date().toISOString(),
          } as BreakCompletedEvent);

          let finalScores: FrameEndEvent['scores'] = {};
          if (prev.gameMode === 'singles' && newPlayerFrameScores) {
            if (newPlayerFrameScores[0] > newPlayerFrameScores[1]) gameWinnerIdentifier = getPlayerDisplayName(newPlayers[0]);
            else if (newPlayerFrameScores[1] > newPlayerFrameScores[0]) gameWinnerIdentifier = getPlayerDisplayName(newPlayers[1]);
            else gameWinnerIdentifier = "Draw";
            finalScores = { player1: newPlayerFrameScores[0], player2: newPlayerFrameScores[1] };
          } else if (prev.gameMode === 'doubles') {
            if ((newTeamAScore ?? 0) > (newTeamBScore ?? 0)) gameWinnerIdentifier = 'Team A';
            else if ((newTeamBScore ?? 0) > (newTeamAScore ?? 0)) gameWinnerIdentifier = 'Team B';
            else gameWinnerIdentifier = "Draw";
            finalScores = { teamA: newTeamAScore, teamB: newTeamBScore };
          }

          newFrameHistory.push({
              type: 'frame_end',
              winningIdentifier: gameWinnerIdentifier ?? undefined,
              scores: finalScores,
              timestamp: new Date().toISOString(),
          } as FrameEndEvent);

          return {
            ...prev,
            players: newPlayers,
            playerFrameScores: newPlayerFrameScores,
            teamAScore: newTeamAScore,
            teamBScore: newTeamBScore,
            currentBreak: newPlayers[activePlayerIndex].score,
            currentBreakPots: [],
            redsRemaining: 0,
            gamePhase: 'colors_sequence',
            lastPotWasRed: false,
            nextColorInSequence: 'Black',
            winnerIdentifier: gameWinnerIdentifier,
            scoreUpdateFor: scoreUpdateTriggerKey,
            frameHistory: newFrameHistory,
          };
        }
      }

      if (newRedsRemaining === 0 && !newLastPotWasRed && prev.gamePhase === 'reds_and_colors' && ball.name !== 'Red') {
          newGamePhase = 'colors_sequence';
          newNextColorInSequence = 'Yellow';
      }

      return {
        ...prev,
        players: newPlayers,
        playerFrameScores: newPlayerFrameScores,
        teamAScore: newTeamAScore,
        teamBScore: newTeamBScore,
        currentPlayerIndex: activePlayerIndex,
        currentBreak: newPlayers[activePlayerIndex].score,
        currentBreakPots: currentBreakPotsUpdate,
        redsRemaining: newRedsRemaining,
        gamePhase: newGamePhase,
        lastPotWasRed: newLastPotWasRed,
        nextColorInSequence: newNextColorInSequence,
        scoreUpdateFor: scoreUpdateTriggerKey,
        frameHistory: newFrameHistory,
        winnerIdentifier: null,
      };
    });
  };

  const handleFoul = () => {
    if (!gameState.gameMode || gameState.winnerIdentifier) return;
    saveToHistory();
    const foulTimestamp = new Date().toISOString();
    const foulingPlayer = gameState.players[gameState.currentPlayerIndex];
    const numPlayers = gameState.players.length;
    const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % numPlayers;
    const nextPlayer = gameState.players[nextPlayerIndex];

    let beneficiaryIdentifier = "";
    let scoreUpdateTriggerKey: string | undefined = undefined;

    if (gameState.gameMode === 'singles') {
      beneficiaryIdentifier = getPlayerDisplayName(nextPlayer);
      scoreUpdateTriggerKey = `player${nextPlayerIndex + 1}`;
    } else if (gameState.gameMode === 'doubles') {
      beneficiaryIdentifier = foulingPlayer.teamId === 'A' ? 'Team B' : 'Team A';
      scoreUpdateTriggerKey = beneficiaryIdentifier === 'Team A' ? 'teamA' : 'teamB';
    }

    toast({ title: "Foul!", description: `${FOUL_POINTS} points to ${beneficiaryIdentifier}. ${getPlayerDisplayName(nextPlayer)}'s turn.`});

    setGameState(prev => {
      if (!prev.gameMode || prev.winnerIdentifier) return prev;
      const foulingPlayerIndex = prev.currentPlayerIndex;
      const currentFoulingPlayer = prev.players[foulingPlayerIndex];
      let newPlayers = prev.players.map(p => ({...p}));
      let newFrameHistory = [...prev.frameHistory];

      let newPlayerFrameScores = prev.playerFrameScores ? [...prev.playerFrameScores] as [number,number] : undefined;
      let newTeamAScore = prev.teamAScore;
      let newTeamBScore = prev.teamBScore;

      if (currentFoulingPlayer.score > 0) {
        newPlayers[foulingPlayerIndex] = {
          ...currentFoulingPlayer,
          highestBreak: Math.max(currentFoulingPlayer.highestBreak, currentFoulingPlayer.score),
        };
        newFrameHistory.push({
          type: 'break_completed',
          playerId: currentFoulingPlayer.id,
          ballsPotted: [...prev.currentBreakPots],
          points: currentFoulingPlayer.score,
          timestamp: foulTimestamp,
        } as BreakCompletedEvent);
      }
      newPlayers[foulingPlayerIndex].score = 0;

      newFrameHistory.push({
        type: 'foul',
        penalizedPlayerId: currentFoulingPlayer.id,
        beneficiaryIdentifier: beneficiaryIdentifier,
        pointsAwarded: FOUL_POINTS,
        timestamp: foulTimestamp,
      } as FoulEvent);

      if (prev.gameMode === 'singles' && newPlayerFrameScores) {
        const beneficiaryPlayerIndex = (foulingPlayerIndex + 1) % 2;
        newPlayerFrameScores[beneficiaryPlayerIndex] += FOUL_POINTS;
      } else if (prev.gameMode === 'doubles') {
        if (beneficiaryIdentifier === 'Team A') {
          newTeamAScore = (newTeamAScore ?? 0) + FOUL_POINTS;
        } else {
          newTeamBScore = (newTeamBScore ?? 0) + FOUL_POINTS;
        }
      }

      let nextPhase = prev.gamePhase;
      if (prev.redsRemaining === 0 && prev.gamePhase === 'reds_and_colors') {
        nextPhase = 'colors_sequence';
      }

      const newCurrentPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;

      return {
        ...prev,
        players: newPlayers,
        playerFrameScores: newPlayerFrameScores,
        teamAScore: newTeamAScore,
        teamBScore: newTeamBScore,
        currentPlayerIndex: newCurrentPlayerIndex,
        currentBreak: 0,
        currentBreakPots: [],
        lastPotWasRed: false,
        gamePhase: nextPhase,
        nextColorInSequence: nextPhase === 'colors_sequence' && prev.gamePhase === 'reds_and_colors' ? 'Yellow' : prev.nextColorInSequence,
        frameHistory: newFrameHistory,
        scoreUpdateFor: scoreUpdateTriggerKey,
      };
    });
  };

  const handleMiss = () => {
    if (!gameState.gameMode || gameState.winnerIdentifier) return;
    saveToHistory();
    const missTimestamp = new Date().toISOString();
    const missingPlayer = gameState.players[gameState.currentPlayerIndex];
    const numPlayers = gameState.players.length;
    const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % numPlayers;
    const nextPlayer = gameState.players[nextPlayerIndex];

    toast({ title: "Miss!", description: `${getPlayerDisplayName(missingPlayer)} missed. ${getPlayerDisplayName(nextPlayer)}'s turn.`});

    setGameState(prev => {
      if (!prev.gameMode || prev.winnerIdentifier) return prev;
      const missingPlayerIndex = prev.currentPlayerIndex;
      const currentMissingPlayer = prev.players[missingPlayerIndex];
      let newFrameHistory = [...prev.frameHistory];
      let newPlayers = prev.players.map(p => ({...p}));

      if (currentMissingPlayer.score > 0) {
         newPlayers[missingPlayerIndex] = {
          ...currentMissingPlayer,
          highestBreak: Math.max(currentMissingPlayer.highestBreak, currentMissingPlayer.score),
        };
        newFrameHistory.push({
          type: 'break_completed',
          playerId: currentMissingPlayer.id,
          ballsPotted: [...prev.currentBreakPots],
          points: currentMissingPlayer.score,
          timestamp: missTimestamp,
        } as BreakCompletedEvent);
      }
      newPlayers[missingPlayerIndex].score = 0;

      newFrameHistory.push({
        type: 'miss',
        playerId: currentMissingPlayer.id,
        timestamp: missTimestamp,
      } as MissEvent);

      let nextPhase = prev.gamePhase;
      if (prev.redsRemaining === 0 && prev.gamePhase === 'reds_and_colors') {
        nextPhase = 'colors_sequence';
      }

      const newCurrentPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;

      return {
        ...prev,
        players: newPlayers,
        currentPlayerIndex: newCurrentPlayerIndex,
        currentBreak: 0,
        currentBreakPots: [],
        lastPotWasRed: false,
        gamePhase: nextPhase,
        nextColorInSequence: nextPhase === 'colors_sequence' && prev.gamePhase === 'reds_and_colors' ? 'Yellow' : prev.nextColorInSequence,
        frameHistory: newFrameHistory,
      };
    });
  };

  const handleUndo = () => {
    if (!gameState.gameMode) return;
    if (gameState.shotsHistory.length > 0) {
      const lastState = gameState.shotsHistory[gameState.shotsHistory.length - 1];
      setGameState({
        ...lastState,
        shotsHistory: gameState.shotsHistory.slice(0, -1),
        scoreUpdateFor: undefined,
      });
      toast({ title: "Undo Successful", description: "Last action reverted."});
    }
  };

  const handleNewFrame = () => {
    if (!gameState.gameMode) return;
    const currentPlayerNames = gameState.players.map(p => p.name);

    const newInitialState = createInitialGameState(gameState.gameMode);
    newInitialState.players.forEach((p, idx) => {
      if (idx < currentPlayerNames.length) {
        p.name = currentPlayerNames[idx];
      }
    });
    newInitialState.frameHistory = [{ type: 'frame_start', gameMode: gameState.gameMode, playerNames: newInitialState.players.map(p => getPlayerDisplayName(p)), timestamp: new Date().toISOString() } as FrameStartEvent];

    setGameState(newInitialState);
    toast({ title: "New Frame Started", description: "Scores and breaks reset."});
  };

  const handleEndFrameManually = useCallback(() => {
    if (!gameState.gameMode || gameState.winnerIdentifier) return;
    saveToHistory();

    setGameState(prev => {
      if (!prev.gameMode) return prev;

      let newFrameHistory = [...prev.frameHistory];
      let finalPlayersState = prev.players.map(p => ({...p}));
      const currentPlayerObject = finalPlayersState[prev.currentPlayerIndex];

      if (currentPlayerObject.score > 0) {
          finalPlayersState[prev.currentPlayerIndex] = {
            ...currentPlayerObject,
            highestBreak: Math.max(currentPlayerObject.highestBreak, currentPlayerObject.score)
          };
          newFrameHistory.push({
            type: 'break_completed',
            playerId: currentPlayerObject.id,
            ballsPotted: [...prev.currentBreakPots],
            points: currentPlayerObject.score,
            timestamp: new Date().toISOString(),
          } as BreakCompletedEvent);
          finalPlayersState[prev.currentPlayerIndex].score = 0;
      }

      let winnerId: string | undefined = undefined;
      let finalScores: FrameEndEvent['scores'] = {};

      if (prev.gameMode === 'singles' && prev.playerFrameScores) {
        if (prev.playerFrameScores[0] > prev.playerFrameScores[1]) winnerId = getPlayerDisplayName(prev.players[0]);
        else if (prev.playerFrameScores[1] > prev.playerFrameScores[0]) winnerId = getPlayerDisplayName(prev.players[1]);
        else winnerId = "Draw";
        finalScores = { player1: prev.playerFrameScores[0], player2: prev.playerFrameScores[1] };
      } else if (prev.gameMode === 'doubles') {
        if ((prev.teamAScore ?? 0) > (prev.teamBScore ?? 0)) winnerId = 'Team A';
        else if ((prev.teamBScore ?? 0) > (prev.teamAScore ?? 0)) winnerId = 'Team B';
        else winnerId = "Draw";
        finalScores = { teamA: prev.teamAScore, teamB: prev.teamBScore };
      }

      newFrameHistory.push({
          type: 'frame_end',
          winningIdentifier: winnerId,
          scores: finalScores,
          timestamp: new Date().toISOString(),
      } as FrameEndEvent);

      return {
        ...prev,
        players: finalPlayersState,
        winnerIdentifier: winnerId ?? null,
        currentBreak: 0,
        currentBreakPots: [],
        frameHistory: newFrameHistory
      };
    });
  }, [gameState.gameMode, gameState.winnerIdentifier, saveToHistory, getPlayerDisplayName]);

  if (!isGameInitialized || !gameState.gameMode) {
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
          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">Snooker Scorekeeper</h1>
          <p className="text-lg text-foreground/80 mt-2">Choose your game mode</p>
        </header>
        <div className="space-y-4 sm:space-y-0 sm:space-x-6 flex flex-col sm:flex-row">
          <Button onClick={() => initializeGame('singles')} size="lg" className="w-full sm:w-auto">
            <User className="mr-2 h-5 w-5" /> Singles Game
          </Button>
          <Button onClick={() => initializeGame('doubles')} size="lg" className="w-full sm:w-auto">
            <Users className="mr-2 h-5 w-5" /> Doubles Game
          </Button>
        </div>
         <footer className="absolute bottom-8 text-center text-xs sm:text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Cue Sports Scorekeeper. Built by Arvinder.</p>
        </footer>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const currentPlayerDisplayName = getPlayerDisplayName(currentPlayer);
  const currentPlayerTeamName = gameState.gameMode === 'doubles' && currentPlayer.teamId ? `Team ${currentPlayer.teamId} - ` : '';
  const currentBreakScore = currentPlayer.score;


  return (
    <div className="min-h-screen flex flex-col items-center p-2 sm:p-4 md:p-8 bg-background font-body">
      <div className="w-full max-w-4xl mb-4 self-start">
        <Link href="/" passHref>
          <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      <header className="mb-4 sm:mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline text-primary">
          Snooker {gameState.gameMode === 'singles' ? 'Singles' : 'Doubles'} Scorekeeper
        </h1>
      </header>

      <main className="w-full max-w-4xl bg-card/10 p-2 sm:p-4 md:p-6 rounded-xl shadow-2xl">
        {gameState.gameMode === 'singles' && gameState.players.length === 2 && gameState.playerFrameScores && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 items-start mb-4 sm:mb-6">
            <PlayerScoreDisplay
              player={gameState.players[0]}
              mainScore={gameState.playerFrameScores[0]}
              currentBreakDisplayScore={gameState.players[0].score}
              isActive={gameState.currentPlayerIndex === 0}
              isSinglesMode={true}
              scoreJustUpdated={gameState.scoreUpdateFor === 'player1'}
              onPlayerNameChange={handlePlayerNameChange}
            />
            <div className="font-headline text-primary text-3xl text-center hidden md:block pt-16">VS</div>
            <PlayerScoreDisplay
              player={gameState.players[1]}
              mainScore={gameState.playerFrameScores[1]}
              currentBreakDisplayScore={gameState.players[1].score}
              isActive={gameState.currentPlayerIndex === 1}
              isSinglesMode={true}
              scoreJustUpdated={gameState.scoreUpdateFor === 'player2'}
              onPlayerNameChange={handlePlayerNameChange}
            />
          </div>
        )}

        {gameState.gameMode === 'doubles' && gameState.players.length === 4 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 items-start mb-4 sm:mb-6">
            <TeamScoreDisplay
              teamId="A"
              teamName="Team A"
              score={gameState.teamAScore ?? 0}
              players={gameState.players.filter(p => p.teamId === 'A') as [Player, Player]}
              activePlayerId={currentPlayer.teamId === 'A' ? currentPlayer.id : undefined}
              scoreJustUpdated={gameState.scoreUpdateFor === 'teamA'}
              onPlayerNameChange={handlePlayerNameChange}
              currentPlayerBreakScore={currentPlayer.teamId === 'A' ? currentBreakScore : 0}
            />
            <div className="font-headline text-primary text-3xl text-center hidden md:block pt-16">VS</div>
            <TeamScoreDisplay
              teamId="B"
              teamName="Team B"
              score={gameState.teamBScore ?? 0}
              players={gameState.players.filter(p => p.teamId === 'B') as [Player, Player]}
              activePlayerId={currentPlayer.teamId === 'B' ? currentPlayer.id : undefined}
              scoreJustUpdated={gameState.scoreUpdateFor === 'teamB'}
              onPlayerNameChange={handlePlayerNameChange}
              currentPlayerBreakScore={currentPlayer.teamId === 'B' ? currentBreakScore : 0}
            />
          </div>
        )}

        <Separator className="my-4 sm:my-6 bg-primary/30" />

        <div className="text-center mb-4 sm:mb-6">
          <p className="text-base sm:text-lg text-foreground/80">
            Current Player: <strong className="text-accent font-semibold">{currentPlayerTeamName}{currentPlayerDisplayName}</strong>
          </p>
          <p className="text-xl sm:text-2xl font-bold text-primary">
            Current Break: <span className="text-accent">{currentBreakScore}</span>
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Reds Remaining: {gameState.redsRemaining} |
            Phase: {gameState.gamePhase === 'reds_and_colors' ? 'Reds & Colors' : `Colors: ${gameState.nextColorInSequence}`}
            {gameState.gamePhase === 'reds_and_colors' && ` | Next: ${gameState.lastPotWasRed ? 'Color' : (gameState.redsRemaining > 0 ? 'Red' : 'Color')}`}
          </p>
        </div>

        <ScoreControls
          onPot={handlePot}
          onFoul={handleFoul}
          onMiss={handleMiss}
          gameState={gameState}
        />

        <Separator className="my-4 sm:my-6 bg-primary/30" />

        <GameActions
          onUndo={handleUndo}
          canUndo={gameState.shotsHistory.length > 0 && !gameState.winnerIdentifier}
          onNewFrame={handleNewFrame}
          onEndFrame={handleEndFrameManually}
          disableEndFrame={!!gameState.winnerIdentifier}
        />

        <Separator className="my-4 sm:my-6 bg-primary/30" />

        <BreakHistoryDisplay frameHistory={gameState.frameHistory} players={gameState.players} gameMode={gameState.gameMode} />

      </main>

      {gameState.winnerIdentifier && (
        <WinnerPopup
          winnerIdentifier={gameState.winnerIdentifier}
          gameState={gameState}
          onClose={handleNewFrame}
        />
      )}
      <footer className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Cue Sports Scorekeeper. Built by Arvinder.</p>
      </footer>
    </div>
  );
}
