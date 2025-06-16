
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { GameState, Player, Ball, SnookerFrameEvent, BreakCompletedEvent, FoulEvent, MissEvent, FrameStartEvent, FrameEndEvent } from '@/types/snooker';
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
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';


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
          if (loadedState && loadedState.gameMode && !loadedState.winnerIdentifier) { 
            setGameState(loadedState);
            setIsGameInitialized(true);
            setGameMode(loadedState.gameMode);
          } else if (loadedState && loadedState.winnerIdentifier) { 
             localStorage.removeItem(LOCAL_STORAGE_KEY_SNOOKER);
          }
        } catch (error) {
          console.error("Failed to load snooker game state from localStorage:", error);
          localStorage.removeItem(LOCAL_STORAGE_KEY_SNOOKER);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isGameInitialized && gameState.gameMode && !gameState.winnerIdentifier) {
      localStorage.setItem(LOCAL_STORAGE_KEY_SNOOKER, JSON.stringify(gameState));
    }
  }, [gameState, isGameInitialized]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && isGameInitialized && gameState.winnerIdentifier) {
        localStorage.removeItem(LOCAL_STORAGE_KEY_SNOOKER);
    }
  }, [gameState.winnerIdentifier, isGameInitialized]);


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
        if (lastFrameStartEventIndex !== -1 && newFrameHistory[lastFrameStartEventIndex].type === 'frame_start') {
             const typedEvent = newFrameHistory[lastFrameStartEventIndex] as FrameStartEvent;
            newFrameHistory[lastFrameStartEventIndex] = {
                ...typedEvent,
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

  const addHistoryEvent = useCallback((eventData: Omit<SnookerFrameEvent, 'timestamp'>) => {
    setGameState(prev => ({
      ...prev,
      frameHistory: [...prev.frameHistory, { ...eventData, timestamp: new Date().toISOString() } as SnookerFrameEvent]
    }));
  }, []);


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
      shotsHistory: [...prev.shotsHistory, { ...prev, shotsHistory: [], frameHistory: [] }], 
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
      let newFrameHistory = [...prev.frameHistory]; 

      if (newGamePhase === 'reds_and_colors') {
        if (ball.name === 'Red') {
          newRedsRemaining--;
          newLastPotWasRed = true;
        } else {
          newLastPotWasRed = false;
        }
      } else { 
        if (ball.name === 'Yellow') newNextColorInSequence = 'Green';
        else if (ball.name === 'Green') newNextColorInSequence = 'Brown';
        else if (ball.name === 'Brown') newNextColorInSequence = 'Blue';
        else if (ball.name === 'Blue') newNextColorInSequence = 'Pink';
        else if (ball.name === 'Pink') newNextColorInSequence = 'Black';
        else if (ball.name === 'Black') {
          const playerAfterPot = newPlayers[activePlayerIndex];
          const currentBreakScoreValue = playerAfterPot.score; 
          newPlayers[activePlayerIndex] = {
            ...playerAfterPot,
            highestBreak: Math.max(playerAfterPot.highestBreak, currentBreakScoreValue),
          };

          newFrameHistory.push({
            type: 'break_completed',
            playerId: playerAfterPot.id,
            ballsPotted: [...currentBreakPotsUpdate],
            points: currentBreakScoreValue, 
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
            finalScores = { teamA: newTeamAScore ?? 0, teamB: newTeamBScore ?? 0 };
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
            currentBreak: 0, 
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

  const handleFoul = (foulPointsToAward: number) => {
    if (!gameState.gameMode || gameState.winnerIdentifier) return;
    saveToHistory();
    const foulTimestamp = new Date().toISOString();
    const foulingPlayer = gameState.players[gameState.currentPlayerIndex];
    const numPlayers = gameState.players.length;
    const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % numPlayers;
    const nextPlayer = gameState.players[nextPlayerIndex];

    let beneficiaryIdentifier = "";
    let scoreUpdateTriggerKey: string | undefined = undefined;
    let newPlayerFrameScoresFoul = gameState.playerFrameScores ? [...gameState.playerFrameScores] as [number,number] : undefined;
    let newTeamAScoreFoul = gameState.teamAScore;
    let newTeamBScoreFoul = gameState.teamBScore;


    if (gameState.gameMode === 'singles' && newPlayerFrameScoresFoul) {
      beneficiaryIdentifier = getPlayerDisplayName(nextPlayer);
      scoreUpdateTriggerKey = `player${nextPlayerIndex + 1}`;
      newPlayerFrameScoresFoul[nextPlayerIndex] += foulPointsToAward;
    } else if (gameState.gameMode === 'doubles') {
      const beneficiaryTeamId = foulingPlayer.teamId === 'A' ? 'B' : 'A';
      beneficiaryIdentifier = `Team ${beneficiaryTeamId}`;
      scoreUpdateTriggerKey = beneficiaryTeamId === 'A' ? 'teamA' : 'teamB';
      if (beneficiaryTeamId === 'A') {
        newTeamAScoreFoul = (newTeamAScoreFoul ?? 0) + foulPointsToAward;
      } else {
        newTeamBScoreFoul = (newTeamBScoreFoul ?? 0) + foulPointsToAward;
      }
    }

    toast({ title: "Foul!", description: `${foulPointsToAward} points to ${beneficiaryIdentifier}. ${getPlayerDisplayName(nextPlayer)}'s turn.`});
    
    const eventsToAdd: SnookerFrameEvent[] = [];
    if (foulingPlayer.score > 0) {
        eventsToAdd.push({
          type: 'break_completed',
          playerId: foulingPlayer.id,
          ballsPotted: [...gameState.currentBreakPots],
          points: foulingPlayer.score,
          timestamp: foulTimestamp,
        } as BreakCompletedEvent);
    }
    eventsToAdd.push({
        type: 'foul',
        penalizedPlayerId: foulingPlayer.id,
        beneficiaryIdentifier: beneficiaryIdentifier,
        pointsAwarded: foulPointsToAward,
        timestamp: foulTimestamp,
    } as FoulEvent);


    setGameState(prev => {
      if (!prev.gameMode || prev.winnerIdentifier) return prev;
      const foulingPlayerIndex = prev.currentPlayerIndex;
      let newPlayers = prev.players.map((p, idx) => 
        idx === foulingPlayerIndex ? {...p, score: 0, highestBreak: Math.max(p.highestBreak, p.score)} : {...p}
      );
      
      let nextPhase = prev.gamePhase;
      if (prev.redsRemaining === 0 && prev.gamePhase === 'reds_and_colors') {
        nextPhase = 'colors_sequence';
      }
      
      const newCurrentPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;

      return {
        ...prev,
        players: newPlayers,
        playerFrameScores: newPlayerFrameScoresFoul,
        teamAScore: newTeamAScoreFoul,
        teamBScore: newTeamBScoreFoul,
        currentPlayerIndex: newCurrentPlayerIndex,
        currentBreak: 0, 
        currentBreakPots: [], 
        lastPotWasRed: false, 
        gamePhase: nextPhase,
        nextColorInSequence: nextPhase === 'colors_sequence' && prev.gamePhase === 'reds_and_colors' ? 'Yellow' : prev.nextColorInSequence,
        frameHistory: [...prev.frameHistory, ...eventsToAdd],
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
    
    const eventsToAdd: SnookerFrameEvent[] = [];
    if (missingPlayer.score > 0) {
         eventsToAdd.push({
          type: 'break_completed',
          playerId: missingPlayer.id,
          ballsPotted: [...gameState.currentBreakPots],
          points: missingPlayer.score,
          timestamp: missTimestamp,
        } as BreakCompletedEvent);
    }
    eventsToAdd.push({
        type: 'miss',
        playerId: missingPlayer.id,
        timestamp: missTimestamp,
    } as MissEvent);


    setGameState(prev => {
      if (!prev.gameMode || prev.winnerIdentifier) return prev;
      const missingPlayerIndex = prev.currentPlayerIndex;
      let newPlayers = prev.players.map((p, idx) => 
        idx === missingPlayerIndex ? {...p, score: 0, highestBreak: Math.max(p.highestBreak, p.score)} : {...p}
      );

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
        frameHistory: [...prev.frameHistory, ...eventsToAdd],
      };
    });
  };

  const handleUndo = () => {
    if (!gameState.gameMode) return;
    if (gameState.shotsHistory.length > 0) {
      const lastFullState = gameState.shotsHistory[gameState.shotsHistory.length - 1];
      
      setGameState({
        ...lastFullState,
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

    const eventsToAdd: SnookerFrameEvent[] = [];
    let finalPlayersState = gameState.players.map(p => ({...p})); 
    const currentPlayerObject = finalPlayersState[gameState.currentPlayerIndex];

    if (currentPlayerObject.score > 0) {
        finalPlayersState[gameState.currentPlayerIndex] = { 
          ...currentPlayerObject,
          highestBreak: Math.max(currentPlayerObject.highestBreak, currentPlayerObject.score),
          score: 0 
        };
        eventsToAdd.push({
          type: 'break_completed',
          playerId: currentPlayerObject.id,
          ballsPotted: [...gameState.currentBreakPots],
          points: currentPlayerObject.score,
          timestamp: new Date().toISOString(),
        } as BreakCompletedEvent);
    }

    let winnerId: string | undefined = undefined;
    let finalScores: FrameEndEvent['scores'] = {};

    if (gameState.gameMode === 'singles' && gameState.playerFrameScores) {
      finalScores = { player1: gameState.playerFrameScores[0], player2: gameState.playerFrameScores[1] };
      if (gameState.playerFrameScores[0] > gameState.playerFrameScores[1]) winnerId = getPlayerDisplayName(gameState.players[0]);
      else if (gameState.playerFrameScores[1] > gameState.playerFrameScores[0]) winnerId = getPlayerDisplayName(gameState.players[1]);
      else winnerId = "Draw";
    } else if (gameState.gameMode === 'doubles') {
      finalScores = { teamA: gameState.teamAScore ?? 0, teamB: gameState.teamBScore ?? 0 };
      if ((gameState.teamAScore ?? 0) > (gameState.teamBScore ?? 0)) winnerId = 'Team A';
      else if ((gameState.teamBScore ?? 0) > (gameState.teamAScore ?? 0)) winnerId = 'Team B';
      else winnerId = "Draw";
    }

    eventsToAdd.push({
        type: 'frame_end',
        winningIdentifier: winnerId, 
        scores: finalScores,
        timestamp: new Date().toISOString(),
    } as FrameEndEvent);

    setGameState(prev => ({
      ...prev,
      players: finalPlayersState, 
      winnerIdentifier: winnerId ?? null, 
      currentBreak: 0, 
      currentBreakPots: [],
      frameHistory: [...prev.frameHistory, ...eventsToAdd]
    }));
  }, [gameState, saveToHistory, getPlayerDisplayName]);

  const handleNewGameAndSelectMode = () => {
    setIsGameInitialized(false);
    setGameMode(null);
    setGameState(createInitialGameState(null)); 
    if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEY_SNOOKER);
    }
    toast({ title: "Ready for New Game", description: "Please select a game mode." });
  };


  if (!isGameInitialized || !gameState.gameMode) {
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
        </div>
        <footer className="text-center text-xs sm:text-sm text-muted-foreground py-4">
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
              Snooker {gameState.gameMode === 'singles' ? 'Singles' : 'Doubles'}
            </h1>
        </div>
        
        {gameState.gameMode === 'singles' && gameState.players.length === 2 && gameState.playerFrameScores && (
          <div className="space-y-2 mb-4">
            {gameState.players.map((player, index) => (
              <PlayerScoreDisplay
                key={player.id}
                player={player}
                mainScore={gameState.playerFrameScores?.[index] ?? 0}
                isActive={gameState.currentPlayerIndex === index && !gameState.winnerIdentifier}
                isSinglesMode={true}
                scoreJustUpdated={gameState.scoreUpdateFor === `player${index + 1}`}
                onPlayerNameChange={handlePlayerNameChange}
                currentBreakDisplayScore={gameState.currentPlayerIndex === index ? player.score : undefined}
                disabled={!!gameState.winnerIdentifier}
              />
            ))}
          </div>
        )}

        {gameState.gameMode === 'doubles' && gameState.players.length >= 2 && ( 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 items-start mb-4 sm:mb-6">
            <TeamScoreDisplay
              teamId="A"
              teamName="Team A"
              score={gameState.teamAScore ?? 0}
              players={gameState.players.filter(p => p.teamId === 'A') as [Player, Player]} 
              activePlayerId={currentPlayer.teamId === 'A' && !gameState.winnerIdentifier ? currentPlayer.id : undefined}
              scoreJustUpdated={gameState.scoreUpdateFor === 'teamA'}
              onPlayerNameChange={handlePlayerNameChange}
              currentPlayerBreakScore={currentPlayer.teamId === 'A' ? currentBreakScore : 0}
              disabled={!!gameState.winnerIdentifier}
            />
            <div className="font-headline text-primary text-3xl text-center hidden md:flex items-center justify-center pt-8">VS</div>
            <TeamScoreDisplay
              teamId="B"
              teamName="Team B"
              score={gameState.teamBScore ?? 0}
              players={gameState.players.filter(p => p.teamId === 'B') as [Player, Player]} 
              activePlayerId={currentPlayer.teamId === 'B' && !gameState.winnerIdentifier ? currentPlayer.id : undefined}
              scoreJustUpdated={gameState.scoreUpdateFor === 'teamB'}
              onPlayerNameChange={handlePlayerNameChange}
              currentPlayerBreakScore={currentPlayer.teamId === 'B' ? currentBreakScore : 0}
              disabled={!!gameState.winnerIdentifier}
            />
          </div>
        )}

        {!gameState.winnerIdentifier && currentPlayer && (
          <>
            <div className="text-center mb-3 sm:mb-4">
              <p className="text-sm sm:text-base text-muted-foreground">
                Current: <strong className={cn(gameState.gameMode === 'doubles' && currentPlayer.teamId === 'A' ? "text-primary" : gameState.gameMode === 'doubles' && currentPlayer.teamId === 'B' ? "text-red-500" : "text-accent-foreground")}>{currentPlayerTeamName}{currentPlayerDisplayName}</strong>
              </p>
              {currentBreakScore > 0 && (
                  <p className="text-lg sm:text-xl font-bold text-accent">
                      Break: {currentBreakScore}
                  </p>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
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

            <GameActions
              onUndo={handleUndo}
              canUndo={gameState.shotsHistory.length > 0 && !gameState.winnerIdentifier}
              onNewFrame={handleNewFrame}
              onEndFrame={handleEndFrameManually}
              disableEndFrame={!!gameState.winnerIdentifier}
            />
          </>
        )}
        
        {gameState.winnerIdentifier && (
           <div className="text-center my-6">
             <p className="text-2xl font-bold text-accent">Frame Over! Winner: {gameState.winnerIdentifier}</p>
             <Button onClick={handleNewFrame} className="mt-4">Start New Frame</Button>
           </div>
        )}

        <div className="mt-auto">
            <Separator className="my-4 bg-primary/30" />
            <BreakHistoryDisplay frameHistory={gameState.frameHistory} players={gameState.players} gameMode={gameState.gameMode} />
            <Separator className="my-4 bg-primary/30" />
            <Button variant="outline" onClick={handleNewGameAndSelectMode} className="w-full py-3 bg-background hover:bg-accent/10">
                <Home className="mr-2 h-5 w-5" /> Change Mode / New Snooker Game
            </Button>
        </div>
      </main>

      {gameState.winnerIdentifier && (
        <WinnerPopup
          winnerIdentifier={gameState.winnerIdentifier}
          gameState={gameState}
          onClose={handleNewFrame} 
        />
      )}
      <footer className="py-4 text-center text-xs sm:text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Cue Sports Scorekeeper. Built by Arvinder.</p>
      </footer>
    </div>
  );
}

