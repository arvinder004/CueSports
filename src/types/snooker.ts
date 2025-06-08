
export interface Player {
  id: number;
  name: string;
  score: number; // Represents current break score for snooker, or total score for century
  highestBreak: number; // Primarily for snooker
  teamId?: 'A' | 'B'; // Optional for singles mode in snooker, used in Century team modes
}

export type BallName = 'Red' | 'Yellow' | 'Green' | 'Brown' | 'Blue' | 'Pink' | 'Black' | 'Green Stripe';

export interface Ball {
  name: BallName;
  value: number;
  ballColorHex: string;
  textColorHex: string;
  dataAiHint: string;
}

export type FrameEventType = 'break_completed' | 'foul' | 'miss' | 'frame_start' | 'frame_end';

export interface BaseFrameEvent {
  type: FrameEventType;
  timestamp: string; // ISO string for date
}

export interface BreakCompletedEvent extends BaseFrameEvent {
  type: 'break_completed';
  playerId: number;
  ballsPotted: Ball[];
  points: number; // Points scored in this specific break
}

export interface FoulEvent extends BaseFrameEvent {
  type: 'foul';
  penalizedPlayerId: number;
  beneficiaryIdentifier: string; // Player ID (e.g., "Player 2") or Team ID (e.g., "Team B")
  pointsAwarded: number;
}

export interface MissEvent extends BaseFrameEvent {
  type: 'miss';
  playerId: number;
}

export interface FrameStartEvent extends BaseFrameEvent {
  type: 'frame_start';
  gameMode: 'singles' | 'doubles';
  playerNames: string[];
}

export interface FrameEndEvent extends BaseFrameEvent {
  type: 'frame_end';
  winningIdentifier?: string; // Player ID (e.g., "Player 1") or Team ID (e.g., "Team A")
  scores: { player1?: number; player2?: number; teamA?: number; teamB?: number };
}

export type FrameEvent = BreakCompletedEvent | FoulEvent | MissEvent | FrameStartEvent | FrameEndEvent;

export interface GameState { // For Snooker
  gameMode: 'singles' | 'doubles' | null;
  players: Player[]; // Will have 2 players for singles, 4 for doubles
  // Singles mode scores
  playerFrameScores?: [number, number]; // Total score for player 1, player 2 in singles
  // Doubles mode scores
  teamAScore?: number;
  teamBScore?: number;
  
  currentPlayerIndex: number; // Index in the players array
  currentBreak: number; // Active player's current break score (derived from players[currentPlayerIndex].score)
  redsRemaining: number;
  gamePhase: 'reds_and_colors' | 'colors_sequence';
  lastPotWasRed: boolean;
  nextColorInSequence: BallName;
  shotsHistory: GameState[]; // For undo
  winnerIdentifier: string | null; // e.g., "Player 1", "Team A", or null for draw/ongoing

  // UI animation flags
  scoreUpdateFor?: string; // "player1", "player2", "teamA", "teamB" to trigger animation

  currentBreakPots: Ball[];
  frameHistory: FrameEvent[];
}

export const SNOOKER_BALLS: Ball[] = [
  { name: 'Red', value: 1, ballColorHex: 'dc2626', textColorHex: 'ffffff', dataAiHint: 'red snookerball' },
  { name: 'Yellow', value: 2, ballColorHex: 'facc15', textColorHex: '000000', dataAiHint: 'yellow snookerball' },
  { name: 'Green', value: 3, ballColorHex: '16a34a', textColorHex: 'ffffff', dataAiHint: 'green snookerball' },
  { name: 'Brown', value: 4, ballColorHex: '92400e', textColorHex: 'ffffff', dataAiHint: 'brown snookerball' },
  { name: 'Blue', value: 5, ballColorHex: '2563eb', textColorHex: 'ffffff', dataAiHint: 'blue snookerball' },
  { name: 'Pink', value: 6, ballColorHex: 'ec4899', textColorHex: 'ffffff', dataAiHint: 'pink snookerball' },
  { name: 'Black', value: 7, ballColorHex: '000000', textColorHex: 'ffffff', dataAiHint: 'black snookerball' },
];

export const CENTURY_BALLS: Ball[] = [
  { name: 'Yellow', value: 2, ballColorHex: 'facc15', textColorHex: '000000', dataAiHint: 'yellow ball' },
  { name: 'Green', value: 3, ballColorHex: '16a34a', textColorHex: 'ffffff', dataAiHint: 'green ball' },
  { name: 'Brown', value: 4, ballColorHex: '92400e', textColorHex: 'ffffff', dataAiHint: 'brown ball' },
  { name: 'Blue', value: 5, ballColorHex: '2563eb', textColorHex: 'ffffff', dataAiHint: 'blue ball' },
  { name: 'Pink', value: 6, ballColorHex: 'ec4899', textColorHex: 'ffffff', dataAiHint: 'pink ball' },
  { name: 'Black', value: 7, ballColorHex: '000000', textColorHex: 'ffffff', dataAiHint: 'black ball' },
  { name: 'Red', value: 15, ballColorHex: 'dc2626', textColorHex: 'ffffff', dataAiHint: 'red ball fifteen' },
  { name: 'Green Stripe', value: 11, ballColorHex: '16a34a', textColorHex: 'ffffff', dataAiHint: 'green stripe ball' }, // Placeholder, actual image might differ
];

export const FOUL_POINTS = 4; // For Snooker
export const CENTURY_FOUL_POINTS = 4; // For Century

export type CenturyGameModeId = 
  'singles-2' | 'singles-3' | 'singles-4' | 'singles-5' | 'singles-6' | 'singles-7' | 'singles-8' | 
  'doubles' | 'triples' | 'quadruples';


// Configuration for Century Game Modes
export interface CenturyModeConfig {
  id: CenturyGameModeId;
  numTotalPlayers: number;
  isTeamGame: boolean;
  playersPerTeam?: number; // Only if isTeamGame is true
  targetScore: number;
  label: string;
  icon: React.ElementType; // For UI
}

