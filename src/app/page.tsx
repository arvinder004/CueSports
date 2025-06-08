
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChartBig, Target, Home } from 'lucide-react'; 
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col p-4 bg-background font-body">
      <div className="flex-grow flex flex-col items-center justify-center">
        <header className="mb-12 text-center">
          <div className="inline-block p-4 mb-6 bg-primary/10 rounded-lg shadow-md">
              <Image 
                src="https://placehold.co/128x128/145c52/f0fdfa.png?text=CSS&font=pt-sans" 
                alt="Cue Sports Scorekeeper Icon" 
                width={128} 
                height={128} 
                className="rounded-md"
                data-ai-hint="logo billiards"
                priority
              />
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold font-headline text-primary">
            Welcome to Cue Sports Scorekeeper
          </h1>
          <p className="text-xl text-foreground/80 mt-4 max-w-xl mx-auto">
            Your ultimate tool to track snooker matches and aim for high scores!
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <div className="bg-card/20 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-shadow">
            <h2 className="text-3xl font-semibold text-primary mb-4 text-center">Snooker</h2>
            <p className="text-center text-muted-foreground mb-6">
                Track your frames with ease, precision, and style. Supports singles and doubles.
            </p>
            <Link href="/snooker" passHref className="block">
              <Button size="lg" className="w-full text-lg py-7 shadow-lg hover:shadow-xl transition-shadow">
                <BarChartBig className="mr-3 w-6 h-6" /> Play Snooker
              </Button>
            </Link>
          </div>

          <div className="bg-card/20 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-shadow">
            <h2 className="text-3xl font-semibold text-primary mb-4 text-center">Century</h2>
            <p className="text-center text-muted-foreground mb-6">
                Challenge yourself or friends in various Century game modes.
            </p>
            <Link href="/century" passHref className="block">
              <Button size="lg" variant="secondary" className="w-full text-lg py-7 shadow-lg hover:shadow-xl transition-shadow">
                <Target className="mr-3 w-6 h-6" /> Play Century
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs sm:text-sm text-muted-foreground py-4">
        <p>&copy; {new Date().getFullYear()} Cue Sports Scorekeeper. Built by Arvinder.</p>
      </footer>
    </div>
  );
}
