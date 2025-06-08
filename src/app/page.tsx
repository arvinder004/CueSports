
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChartBig, Target, Home } from 'lucide-react'; 

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background font-body">
      <header className="mb-12 text-center">
        <div className="inline-block p-4 mb-6 bg-primary/10 rounded-full">
            <BarChartBig className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold font-headline text-primary">
          Welcome to Cue Sports Scorekeeper
        </h1>
        <p className="text-xl text-foreground/80 mt-4 max-w-xl mx-auto">
          Your ultimate tool to track snooker matches and aim for high scores!
        </p>
      </header>

      <div className="space-y-8">
        <div className="text-center">
          <Link href="/snooker" passHref>
            <Button size="lg" className="w-full sm:w-auto text-lg py-8 px-12 shadow-lg hover:shadow-xl transition-shadow">
              <BarChartBig className="mr-3 w-6 h-6" /> Play Snooker Now
            </Button>
          </Link>
          <p className="text-center text-muted-foreground mt-3">
              Track your frames with ease, precision, and style. Supports singles and doubles.
          </p>
        </div>

        <div className="text-center">
          <Link href="/century" passHref>
            <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg py-8 px-12 shadow-lg hover:shadow-xl transition-shadow">
              <Target className="mr-3 w-6 h-6" /> Play Century Now
            </Button>
          </Link>
          <p className="text-center text-muted-foreground mt-3">
              Challenge yourself or friends in various Century game modes.
          </p>
        </div>
      </div>
      <footer className="absolute bottom-10 text-center text-xs sm:text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Cue Sports Scorekeeper. Built by Arvinder.</p>
      </footer>
    </div>
  );
}
