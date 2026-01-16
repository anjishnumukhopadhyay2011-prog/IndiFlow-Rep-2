import React, { useState, useEffect, useCallback } from "react";
import { Navigation, MapPin, Car, Sparkles, Brain, Route } from "lucide-react";
import { cn } from "@/lib/utils";

interface StartupAnimationProps {
  onComplete: () => void;
  minDuration?: number; // Minimum duration in ms before animation can complete
}

// Animated logo with pulsing rings
function AnimatedLogo({ phase }: { phase: number }) {
  return (
    <div className="relative">
      {/* Outer rings - expand animation */}
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 border-blue-500/30 transition-all duration-1000",
          phase >= 1 ? "scale-150 opacity-0" : "scale-100 opacity-100"
        )}
      />
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 border-purple-500/30 transition-all duration-1000 delay-200",
          phase >= 1 ? "scale-175 opacity-0" : "scale-100 opacity-100"
        )}
      />
      <div
        className={cn(
          "absolute inset-0 rounded-full border border-blue-400/20 transition-all duration-1000 delay-400",
          phase >= 1 ? "scale-200 opacity-0" : "scale-100 opacity-100"
        )}
      />

      {/* Main logo container */}
      <div
        className={cn(
          "w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 transition-all duration-500",
          phase === 0 && "animate-pulse scale-90",
          phase === 1 && "scale-100",
          phase >= 2 && "scale-110"
        )}
      >
        <Navigation
          className={cn(
            "h-12 w-12 text-white transition-all duration-500",
            phase >= 2 && "animate-bounce"
          )}
        />
      </div>

      {/* Floating particles */}
      {phase >= 1 && (
        <>
          <div className="absolute -top-4 -left-4 w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <div className="absolute -bottom-4 -right-4 w-2 h-2 rounded-full bg-purple-400 animate-ping delay-300" />
          <div className="absolute top-1/2 -right-6 w-1.5 h-1.5 rounded-full bg-blue-300 animate-ping delay-500" />
        </>
      )}
    </div>
  );
}

// Feature icons that animate in
function FeatureIcons({ visible }: { visible: boolean }) {
  const features = [
    { icon: MapPin, color: "text-green-400", delay: "delay-0" },
    { icon: Car, color: "text-blue-400", delay: "delay-100" },
    { icon: Route, color: "text-purple-400", delay: "delay-200" },
    { icon: Brain, color: "text-pink-400", delay: "delay-300" },
    { icon: Sparkles, color: "text-yellow-400", delay: "delay-400" },
  ];

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      {features.map((feature, idx) => (
        <div
          key={idx}
          className={cn(
            "p-3 rounded-full bg-slate-800/50 backdrop-blur border border-slate-700 transition-all duration-500",
            feature.delay,
            visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          )}
          style={{ transitionDelay: `${idx * 100}ms` }}
        >
          <feature.icon className={cn("h-5 w-5", feature.color)} />
        </div>
      ))}
    </div>
  );
}

// Loading progress bar with animated fill
function LoadingProgress({ progress }: { progress: number }) {
  return (
    <div className="w-64 mt-8">
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>Initializing</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// Status text with typing animation
function StatusText({ texts, currentIndex }: { texts: string[]; currentIndex: number }) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const targetText = texts[currentIndex] || "";
    let charIndex = 0;
    setDisplayText("");
    setIsTyping(true);

    const typeInterval = setInterval(() => {
      if (charIndex <= targetText.length) {
        setDisplayText(targetText.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, [currentIndex, texts]);

  return (
    <div className="h-6 mt-4">
      <p className="text-sm text-slate-400">
        {displayText}
        {isTyping && <span className="animate-pulse">|</span>}
      </p>
    </div>
  );
}

export function StartupAnimation({ onComplete, minDuration = 2500 }: StartupAnimationProps) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [canComplete, setCanComplete] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const statusTexts = [
    "Initializing IndiFlow...",
    "Loading AI traffic models...",
    "Preparing navigation system...",
    "Connecting to location services...",
    "Ready to navigate!",
  ];

  // Progress animation
  useEffect(() => {
    const startTime = Date.now();
    const duration = minDuration;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);

      // Update phase based on progress
      if (newProgress >= 25 && phase < 1) setPhase(1);
      if (newProgress >= 60 && phase < 2) setPhase(2);
      if (newProgress >= 90 && phase < 3) setPhase(3);

      // Update status text
      const statusIdx = Math.min(
        statusTexts.length - 1,
        Math.floor((newProgress / 100) * statusTexts.length)
      );
      setStatusIndex(statusIdx);

      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        setCanComplete(true);
      }
    };

    requestAnimationFrame(updateProgress);
  }, [minDuration]);

  // Auto-complete after a brief pause
  useEffect(() => {
    if (canComplete && !isExiting) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        // Wait for exit animation
        setTimeout(onComplete, 500);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [canComplete, isExiting, onComplete]);

  // Allow skip by clicking/tapping
  const handleSkip = useCallback(() => {
    if (progress >= 50) {
      setIsExiting(true);
      setTimeout(onComplete, 300);
    }
  }, [progress, onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center transition-all duration-500",
        isExiting && "opacity-0 scale-105"
      )}
      onClick={handleSkip}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Logo */}
        <AnimatedLogo phase={phase} />

        {/* App Name */}
        <h1
          className={cn(
            "text-4xl font-bold mt-8 transition-all duration-500",
            phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            IndiFlow
          </span>
        </h1>

        {/* Tagline */}
        <p
          className={cn(
            "text-slate-400 mt-2 transition-all duration-500 delay-200",
            phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          AI-Powered Traffic Navigation for India
        </p>

        {/* Feature icons */}
        <FeatureIcons visible={phase >= 2} />

        {/* Loading progress */}
        <LoadingProgress progress={progress} />

        {/* Status text */}
        <StatusText texts={statusTexts} currentIndex={statusIndex} />

        {/* Skip hint */}
        {progress >= 50 && !isExiting && (
          <p className="text-xs text-slate-600 mt-6 animate-pulse">
            Tap anywhere to continue
          </p>
        )}
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-8 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-600 text-xs">
          <Sparkles className="h-3 w-3 text-blue-500" />
          <span>Powered by AI</span>
        </div>
      </div>
    </div>
  );
}

export default StartupAnimation;
