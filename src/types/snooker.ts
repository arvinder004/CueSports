
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

// --- Snooker Specific Types ---
export type SnookerFrameEventType = 'break_completed' | 'foul' | 'miss' | 'frame_start' | 'frame_end';

export interface BaseSnookerFrameEvent {
  type: SnookerFrameEventType;
  timestamp: string; // ISO string for date
}

export interface BreakCompletedEvent extends BaseSnookerFrameEvent {
  type: 'break_completed';
  playerId: number;
  ballsPotted: Ball[];
  points: number; // Points scored in this specific break
}

export interface FoulEvent extends BaseSnookerFrameEvent {
  type: 'foul';
  penalizedPlayerId: number;
  beneficiaryIdentifier: string; // Player ID (e.g., "Player 2") or Team ID (e.g., "Team B")
  pointsAwarded: number;
}

export interface MissEvent extends BaseSnookerFrameEvent {
  type: 'miss';
  playerId: number;
}

export interface FrameStartEvent extends BaseSnookerFrameEvent {
  type: 'frame_start';
  gameMode: 'singles' | 'doubles';
  playerNames: string[];
}

export interface FrameEndEvent extends BaseSnookerFrameEvent {
  type: 'frame_end';
  winningIdentifier?: string; // Player ID (e.g., "Player 1") or Team ID (e.g., "Team A") or "Draw"
  scores: { player1?: number; player2?: number; teamA?: number; teamB?: number };
}

export type SnookerFrameEvent = BreakCompletedEvent | FoulEvent | MissEvent | FrameStartEvent | FrameEndEvent;

export interface GameState { // For Snooker
  gameMode: 'singles' | 'doubles' | null;
  players: Player[];
  playerFrameScores?: [number, number];
  teamAScore?: number;
  teamBScore?: number;
  currentPlayerIndex: number;
  currentBreak: number;
  redsRemaining: number;
  gamePhase: 'reds_and_colors' | 'colors_sequence';
  lastPotWasRed: boolean;
  nextColorInSequence: BallName;
  shotsHistory: GameState[];
  winnerIdentifier: string | null;
  scoreUpdateFor?: string;
  currentBreakPots: Ball[];
  frameHistory: SnookerFrameEvent[];
}

// --- Century Specific Types ---
export type CenturyGameEventType = 'century_game_start' | 'century_pot' | 'century_deduct' | 'century_foul_penalty' | 'century_reset_score' | 'century_turn_change' | 'century_game_end';

export interface BaseCenturyEvent {
  type: CenturyGameEventType;
  timestamp: string;
}

export interface CenturyGameStartEvent extends BaseCenturyEvent {
  type: 'century_game_start';
  modeLabel: string;
  targetScore: number;
  playerNames: string[]; // Names of all players
}

export interface CenturyPotEvent extends BaseCenturyEvent {
  type: 'century_pot';
  playerId: number;
  ball: Ball;
  newPlayerScore: number;
  newTeamScore?: number;
}

export interface CenturyDeductEvent extends BaseCenturyEvent {
  type: 'century_deduct';
  playerId: number;
  ball: Ball;
  newPlayerScore: number;
  newTeamScore?: number;
}

export interface CenturyFoulPenaltyEvent extends BaseCenturyEvent {
  type: 'century_foul_penalty';
  playerId: number;
  pointsDeducted: number;
  newPlayerScore: number;
  newTeamScore?: number;
}

export interface CenturyResetScoreEvent extends BaseCenturyEvent {
  type: 'century_reset_score';
  playerId: number;
  previousPlayerScore: number;
  newPlayerScore: number;
  previousTeamScore?: number;
  newTeamScore?: number;
}

export interface CenturyTurnChangeEvent extends BaseCenturyEvent {
  type: 'century_turn_change';
  previousPlayerId: number;
  nextPlayerId: number;
}

export interface CenturyGameEndEvent extends BaseCenturyEvent {
  type: 'century_game_end';
  winnerName: string;
  finalScores: { [playerNameOrTeam: string]: number };
  targetScore: number;
}

export type CenturyEvent =
  | CenturyGameStartEvent
  | CenturyPotEvent
  | CenturyDeductEvent
  | CenturyFoulPenaltyEvent
  | CenturyResetScoreEvent
  | CenturyTurnChangeEvent
  | CenturyGameEndEvent;


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
  { name: 'Green Stripe', value: 11, ballColorHex: '16a34a', textColorHex: 'ffffff', dataAiHint: 'green stripe ball' },
];

export const FOUL_POINTS = 4; // For Snooker
export const CENTURY_FOUL_POINTS = 4; // For Century

export type CenturyGameModeId =
  'singles-2' | 'singles-3' | 'singles-4' | 'singles-5' | 'singles-6' | 'singles-7' | 'singles-8' |
  'doubles' | 'triples' | 'quadruples';

export interface CenturyModeConfig {
  id: CenturyGameModeId;
  numTotalPlayers: number;
  isTeamGame: boolean;
  playersPerTeam?: number;
  targetScore: number;
  label: string;
  icon: React.ElementType;
}


// Snapshot of game state for Century's undo functionality
export interface CenturyActionSnapshot {
  selectedModeId: CenturyGameModeId | null;
  isGameInitialized: boolean; // Though likely always true for a snapshot during a game
  players: Player[];
  teamAScore: number;
  teamBScore: number;
  currentPlayerIndex: number;
  winner: Player | 'Team A' | 'Team B' | 'Draw' | null;
  gameTypeSelection?: 'individual' | 'team' | null; // for setup screen state
  numPlayersIndividualSelection?: string | null; // for setup screen state
  teamTypeSelection?: CenturyGameModeId | null; // for setup screen state
  frameHistory: CenturyEvent[];
}

// Stored state for Century, including frame history and undo history
export interface CenturyStoredState {
  selectedModeId: CenturyGameModeId | null;
  isGameInitialized: boolean;
  players: Player[];
  teamAScore: number;
  teamBScore: number;
  currentPlayerIndex: number;
  winner: Player | 'Team A' | 'Team B' | 'Draw' | null;
  gameTypeSelection?: 'individual' | 'team' | null;
  numPlayersIndividualSelection?: string | null;
  teamTypeSelection?: CenturyGameModeId | null;
  frameHistory: CenturyEvent[];
  actionsHistory?: CenturyActionSnapshot[]; // Optional for backward compatibility with old saved states
}
