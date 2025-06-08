
"use client";

import type { FrameEvent, Player, Ball, BreakCompletedEvent, FoulEvent, MissEvent, FrameStartEvent, FrameEndEvent, GameState } from '@/types/snooker';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface BreakHistoryDisplayProps {
  frameHistory: FrameEvent[];
  players: Player[]; 
  gameMode: GameState['gameMode'];
}

const getPlayerNameAndTeam = (playerId: number, players: Player[], gameMode: GameState['gameMode']): string => {
  const player = players.find(p => p.id === playerId);
  if (!player) return `P-ID ${playerId}?`;
  
  let namePart = player.name || `Player ${player.id}`;
  if (gameMode === 'doubles' && player.teamId) {
    namePart += ` (Team ${player.teamId})`;
  }
  return namePart;
};

const BallImageDisplay = ({ ball, size = 20 }: { ball: Ball, size?: number }) => {
  const imageUrl = `https://placehold.co/${size}x${size}/${ball.ballColorHex}/${ball.textColorHex}.png?text=${ball.value}&font=sans-serif`;
  return (
    <Image
      src={imageUrl}
      alt={`${ball.name} (${ball.value} pts)`}
      width={size}
      height={size}
      className="rounded-full inline-block mx-0.5"
      data-ai-hint={`${ball.dataAiHint} small`}
      priority={false}
    />
  );
};

export default function BreakHistoryDisplay({ frameHistory, players, gameMode }: BreakHistoryDisplayProps) {
  if (!frameHistory || frameHistory.length === 0 || !gameMode) {
    return null;
  }

  const reversedHistory = [...frameHistory].reverse();
  
  return (
    <div className="w-full mt-4">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="frame-history">
          <AccordionTrigger className="text-lg font-semibold text-primary hover:text-primary/80">
            Frame History
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-3 text-sm text-foreground/90 max-h-96 overflow-y-auto pr-2">
              {reversedHistory.map((event, index) => (
                <li key={`${event.type}-${event.timestamp}-${index}`} className="p-2 border-b border-border/50 last:border-b-0">
                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                    <span>Event {reversedHistory.length - index}</span>
                    <span>{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}</span>
                  </div>
                  {event.type === 'frame_start' && (
                    <p>🏁 Frame Started ({ (event as FrameStartEvent).gameMode} mode). Players: {(event as FrameStartEvent).playerNames.join(', ')}.</p>
                  )}
                  {event.type === 'break_completed' && (
                    <div>
                      <p>
                        <strong>{getPlayerNameAndTeam((event as BreakCompletedEvent).playerId, players, gameMode)}</strong> completed a break of{' '}
                        <strong className="text-accent">{(event as BreakCompletedEvent).points}</strong> points.
                      </p>
                      {(event as BreakCompletedEvent).ballsPotted.length > 0 && (
                        <div className="mt-1">
                          Potted: {(event as BreakCompletedEvent).ballsPotted.map((ball, i) => (
                            <BallImageDisplay key={`${ball.name}-${i}-${event.timestamp}`} ball={ball} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {event.type === 'foul' && (
                     <p>
                      🔴 Foul by <strong>{getPlayerNameAndTeam((event as FoulEvent).penalizedPlayerId, players, gameMode)}</strong>.{' '}
                      <strong>{(event as FoulEvent).pointsAwarded}</strong> points to{' '}
                      <strong>{(event as FoulEvent).beneficiaryIdentifier}</strong>.
                    </p>
                  )}
                  {event.type === 'miss' && (
                    <p>💨 <strong>{getPlayerNameAndTeam((event as MissEvent).playerId, players, gameMode)}</strong> missed.</p>
                  )}
                  {event.type === 'frame_end' && (
                    <div>
                      <p>🏆 Frame Ended.</p>
                      <p>
                        Final Scores: 
                        {gameMode === 'singles' && ` ${players.find(p=>p.id===1)?.name || 'Player 1'}: ${(event as FrameEndEvent).scores.player1}, ${players.find(p=>p.id===2)?.name || 'Player 2'}: ${(event as FrameEndEvent).scores.player2}`}
                        {gameMode === 'doubles' && ` Team A: ${(event as FrameEndEvent).scores.teamA}, Team B: ${(event as FrameEndEvent).scores.teamB}`}
                      </p>
                      {(event as FrameEndEvent).winningIdentifier ? (
                        <p>Winner: <strong className="text-accent">{(event as FrameEndEvent).winningIdentifier}</strong></p>
                      ) : (
                        <p>The frame was a draw.</p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
