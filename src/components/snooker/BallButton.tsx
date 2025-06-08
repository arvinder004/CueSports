
"use client";

import type { Ball } from '@/types/snooker';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface BallButtonProps {
  ball: Ball;
  onClick: () => void;
  disabled?: boolean;
}

export default function BallButton({ ball, onClick, disabled }: BallButtonProps) {
  const imageUrl = `https://placehold.co/64x64/${ball.ballColorHex}/${ball.textColorHex}.png?text=${ball.value}&font=sans-serif`;

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full p-0 shadow-md transition-all duration-150 ease-in-out transform active:scale-95 flex justify-center items-center overflow-hidden",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg hover:brightness-110"
      )}
      aria-label={`Pot ${ball.name} (${ball.value} points)`}
    >
      <Image
        src={imageUrl}
        alt={`${ball.name} ball (${ball.value} points)`}
        width={80} 
        height={80}
        className="rounded-full object-cover"
        data-ai-hint={ball.dataAiHint}
        priority={true}
      />
    </Button>
  );
}
