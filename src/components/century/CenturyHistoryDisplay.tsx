
"use client";

import type { CenturyEvent, Player, CenturyModeConfig, CenturyGameStartEvent, CenturyPotEvent, CenturyDeductEvent, CenturyFoulPenaltyEvent, CenturyResetScoreEvent, CenturyTurnChangeEvent, CenturyGameEndEvent, Ball } from '@/types/snooker';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { formatDistanceToNow } from 'date-fns';
import { Gamepad2, CheckCircle2, MinusCircle, AlertOctagon, RotateCcw, Users2, Trophy } from 'lucide-react';
import Image from 'next/image';

interface CenturyHistoryDisplayProps {
  frameHistory: CenturyEvent[];
  players: Player[]; 
  currentModeConfig: CenturyModeConfig | null;
}

const getPlayerNameFromId = (playerId: number, players: Player[]): string => {
  const player = players.find(p => p.id === playerId);
  if (!player) return `P-ID ${playerId}?`;
  return player.name || `Player ${player.id}`;
};

const SmallBallDisplay = ({ ball, size = 20 }: { ball: Ball | undefined; size?: number }) => {
  if (!ball || 
      typeof ball !== 'object' || 
      typeof ball.value !== 'number' || 
      typeof ball.ballColorHex !== 'string' || 
      typeof ball.textColorHex !== 'string' ||
      typeof ball.name !== 'string' ||
      typeof ball.dataAiHint !== 'string') {
    return <span className="text-xs italic">(ball img unavail.)</span>; // Fallback if ball data is incomplete
  }
  const imageUrl = `https://placehold.co/${size}x${size}/${ball.ballColorHex}/${ball.textColorHex}.png?text=${ball.value}&font=sans-serif`;
  return (
    <Image
      src={imageUrl}
      alt={`${ball.name} (${ball.value} pts)`}
      width={size}
      height={size}
      className="rounded-full inline-block mx-0.5 align-middle"
      data-ai-hint={`${ball.dataAiHint} small`}
      priority={false}
    />
  );
};


export default function CenturyHistoryDisplay({ frameHistory, players, currentModeConfig }: CenturyHistoryDisplayProps) {
  if (!frameHistory || frameHistory.length === 0 || !currentModeConfig) {
    return null;
  }

  const reversedHistory = [...frameHistory].reverse();
  
  return (
    <div className="w-full mt-4">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="century-game-history">
          <AccordionTrigger className="text-lg font-semibold text-primary hover:text-primary/80">
            Game History
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-3 text-sm text-foreground/90 max-h-96 overflow-y-auto pr-2">
              {reversedHistory.map((event, index) => (
                <li key={`${event.type}-${event.timestamp}-${index}`} className="p-2 border-b border-border/50 last:border-b-0">
                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                    <span>Event {reversedHistory.length - index}</span>
                    <span>{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}</span>
                  </div>
                  
                  {event.type === 'century_game_start' && (
                    <p className="flex items-center"><Gamepad2 className="w-4 h-4 mr-2 text-primary" /> Game Started: {(event as CenturyGameStartEvent).modeLabel}. Target: {(event as CenturyGameStartEvent).targetScore}. Players: {(event as CenturyGameStartEvent).playerNames.join(', ')}.</p>
                  )}

                  {event.type === 'century_pot' && (() => {
                    const potEvent = event as CenturyPotEvent;
                    return (
                      <p className="flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> 
                        <strong>{getPlayerNameFromId(potEvent.playerId, players)}</strong>
                        {' potted '}
                        <SmallBallDisplay ball={potEvent.ball} />
                        {potEvent.ball && typeof potEvent.ball === 'object' && typeof potEvent.ball.value === 'number' ? (
                          <>
                            {' for '}<strong>{potEvent.ball.value}</strong>{' pts. '}
                          </>
                        ) : (
                          ' (points data unavailable). '
                        )}
                        New score: {potEvent.newPlayerScore}
                        {potEvent.newTeamScore !== undefined ? ` (Team: ${potEvent.newTeamScore})` : ''}.
                      </p>
                    );
                  })()}

                  {event.type === 'century_deduct' && (() => {
                     const deductEvent = event as CenturyDeductEvent;
                     return (
                       <p className="flex items-center">
                          <MinusCircle className="w-4 h-4 mr-2 text-orange-500" /> 
                          <strong>{getPlayerNameFromId(deductEvent.playerId, players)}</strong>
                          {' deducted '}
                          <SmallBallDisplay ball={deductEvent.ball} />
                          {deductEvent.ball && typeof deductEvent.ball === 'object' && typeof deductEvent.ball.value === 'number' ? (
                            <>
                              {' ('}<strong>{deductEvent.ball.value}</strong>{' pts). '}
                            </>
                          ) : (
                            ' (points data unavailable). '
                          )}
                          New score: {deductEvent.newPlayerScore}
                          {deductEvent.newTeamScore !== undefined ? ` (Team: ${deductEvent.newTeamScore})` : ''}.
                       </p>
                     );
                  })()}

                  {event.type === 'century_foul_penalty' && (
                    <p className="flex items-center"><AlertOctagon className="w-4 h-4 mr-2 text-red-500" /> Foul by <strong>{getPlayerNameFromId((event as CenturyFoulPenaltyEvent).playerId, players)}</strong>. Deducted <strong>{(event as CenturyFoulPenaltyEvent).pointsDeducted}</strong> pts. New score: {(event as CenturyFoulPenaltyEvent).newPlayerScore}{(event as CenturyFoulPenaltyEvent).newTeamScore !== undefined ? ` (Team: ${(event as CenturyFoulPenaltyEvent).newTeamScore})` : ''}.</p>
                  )}

                  {event.type === 'century_reset_score' && (
                    <p className="flex items-center"><RotateCcw className="w-4 h-4 mr-2 text-blue-500" /> <strong>{getPlayerNameFromId((event as CenturyResetScoreEvent).playerId, players)}</strong>'s score reset from {(event as CenturyResetScoreEvent).previousPlayerScore} to {(event as CenturyResetScoreEvent).newPlayerScore}. {(event as CenturyResetScoreEvent).newTeamScore !== undefined ? `Team score updated.` : ''}</p>
                  )}

                  {event.type === 'century_turn_change' && (
                     <p className="flex items-center"><Users2 className="w-4 h-4 mr-2 text-gray-500" /> Turn changed from <strong>{getPlayerNameFromId((event as CenturyTurnChangeEvent).previousPlayerId, players)}</strong> to <strong>{getPlayerNameFromId((event as CenturyTurnChangeEvent).nextPlayerId, players)}</strong>.</p>
                  )}

                  {event.type === 'century_game_end' && (
                    <div>
                      <p className="flex items-center"><Trophy className="w-4 h-4 mr-2 text-accent" /> Game Ended. Winner: <strong className="text-accent">{(event as CenturyGameEndEvent).winnerName}</strong>.</p>
                      <p>Target: {(event as CenturyGameEndEvent).targetScore}. Final Scores:
                        {Object.entries((event as CenturyGameEndEvent).finalScores).map(([name, score]) => ` ${name}: ${score}`).join(', ')}.
                      </p>
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
