"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/Button";
import SplashScreen from "./SplashScreen";
import UserHoldings from "./UserHoldings";
import sdk from "@farcaster/frame-sdk";

interface TrendingToken {
  id: number;
  name: string;
  symbol: string;
  img_url: string;
  username: string;
  marketData: {
    marketCap: number;
    price: number;
    priceChange1h: number;
    priceChange24h: number;
    volume24h: number;
  };
  neynarData?: {
    followers?: number;
    following?: number;
    bio?: string;
  };
}

interface GameState {
  tokens: TrendingToken[];
  gamePhase: 'splash' | 'loading' | 'playing' | 'paused' | 'gameOver';
  score: number;
  fludEarned: number;
  loading: boolean;
  error: string | null;
  shibaPosition: { x: number; y: number };
  shibaVelocity: { x: number; y: number };
  tokenPlatforms: Array<{
    id: number;
    x: number;
    y: number;
    width: number;
    token: TrendingToken;
    collected: boolean;
  }>;
  gameSpeed: number;
  lives: number;
}

export default function ShibaRaftGame() {
  const [gameState, setGameState] = useState<GameState>({
    tokens: [],
    gamePhase: 'splash',
    score: 0,
    fludEarned: 0,
    loading: true,
    error: null,
    shibaPosition: { x: 50, y: 300 },
    shibaVelocity: { x: 0, y: 0 },
    tokenPlatforms: [],
    gameSpeed: 2,
    lives: 3
  });

  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'loading' }));
    fetchTrendingTokens();
  };

  // Fetch trending tokens
  const fetchTrendingTokens = async () => {
    try {
      setGameState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/trending-tokens');
      if (!response.ok) {
        throw new Error('Failed to fetch trending tokens');
      }
      
      const tokens: TrendingToken[] = await response.json();
      
      // Create token platforms for the game
      const platforms = tokens.map((token, index) => ({
        id: token.id,
        x: 100 + (index * 200) + Math.random() * 100,
        y: 400 + Math.random() * 200,
        width: 80 + Math.random() * 40,
        token,
        collected: false
      }));

      setGameState(prev => ({
        ...prev,
        tokens,
        tokenPlatforms: platforms,
        loading: false,
        gamePhase: 'playing'
      }));

      // Call sdk.actions.ready() when the game is ready
      try {
        await sdk.actions.ready();
        console.log("✅ Splash screen dismissed - game is ready");
      } catch (error) {
        console.error("Error calling sdk.actions.ready():", error);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
      setGameState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load trending tokens'
      }));
    }
  };

  // Game loop
  useEffect(() => {
    if (gameState.gamePhase !== 'playing') return;

    const gameLoop = () => {
      setGameState(prev => {
        if (prev.gamePhase !== 'playing') return prev;

        // Update shiba position
        const newX = prev.shibaPosition.x + prev.shibaVelocity.x;
        const newY = prev.shibaPosition.y + prev.shibaVelocity.y;

        // Apply gravity
        const gravity = 0.5;
        const newVelocityY = prev.shibaVelocity.y + gravity;

        // Check platform collisions
        let onPlatform = false;
        let newScore = prev.score;
        let newFludEarned = prev.fludEarned;
        let newLives = prev.lives;
        let newPlatforms = [...prev.tokenPlatforms];

        for (const platform of newPlatforms) {
          if (!platform.collected && 
              newX >= platform.x && 
              newX <= platform.x + platform.width &&
              newY >= platform.y - 20 && 
              newY <= platform.y + 10) {
            
            // Landed on platform!
            onPlatform = true;
            platform.collected = true;
            newScore += 100;
            newFludEarned += Math.floor(Math.random() * 50) + 10; // 10-60 FLUD
            
            // Bounce effect
            const bounceVelocityY = -8;
            return {
              ...prev,
              score: newScore,
              fludEarned: newFludEarned,
              tokenPlatforms: newPlatforms,
              shibaPosition: { x: newX, y: platform.y - 20 },
              shibaVelocity: { x: prev.shibaVelocity.x, y: bounceVelocityY }
            };
          }
        }

        // Check if shiba fell off screen
        if (newY > 600) {
          newLives -= 1;
          if (newLives <= 0) {
            return { ...prev, gamePhase: 'gameOver' };
          }
          // Reset shiba position
          return {
            ...prev,
            lives: newLives,
            shibaPosition: { x: 50, y: 300 },
            shibaVelocity: { x: 0, y: 0 }
          };
        }

        // Move platforms to the left (create scrolling effect)
        const newPlatforms = prev.tokenPlatforms.map(platform => ({
          ...platform,
          x: platform.x - prev.gameSpeed
        })).filter(platform => platform.x > -100);

        // Add new platforms if needed
        if (newPlatforms.length < 3) {
          const lastPlatform = newPlatforms[newPlatforms.length - 1];
          const newPlatform = {
            id: Date.now(),
            x: lastPlatform ? lastPlatform.x + 200 + Math.random() * 100 : 800,
            y: 400 + Math.random() * 200,
            width: 80 + Math.random() * 40,
            token: prev.tokens[Math.floor(Math.random() * prev.tokens.length)],
            collected: false
          };
          newPlatforms.push(newPlatform);
        }

        return {
          ...prev,
          shibaPosition: { x: newX, y: newY },
          shibaVelocity: { x: prev.shibaVelocity.x, y: onPlatform ? 0 : newVelocityY },
          tokenPlatforms: newPlatforms
        };
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.gamePhase]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.gamePhase !== 'playing') return;

      setGameState(prev => {
        if (prev.gamePhase !== 'playing') return prev;

        switch (e.code) {
          case 'ArrowLeft':
            return {
              ...prev,
              shibaVelocity: { x: -3, y: prev.shibaVelocity.y }
            };
          case 'ArrowRight':
            return {
              ...prev,
              shibaVelocity: { x: 3, y: prev.shibaVelocity.y }
            };
          case 'Space':
          case 'ArrowUp':
            return {
              ...prev,
              shibaVelocity: { x: prev.shibaVelocity.x, y: -8 }
            };
          default:
            return prev;
        }
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState.gamePhase !== 'playing') return;

      setGameState(prev => {
        if (prev.gamePhase !== 'playing') return prev;

        switch (e.code) {
          case 'ArrowLeft':
          case 'ArrowRight':
            return {
              ...prev,
              shibaVelocity: { x: 0, y: prev.shibaVelocity.y }
            };
          default:
            return prev;
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.gamePhase]);

  const restartGame = () => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'loading',
      score: 0,
      fludEarned: 0,
      lives: 3,
      shibaPosition: { x: 50, y: 300 },
      shibaVelocity: { x: 0, y: 0 },
      tokenPlatforms: []
    }));
    fetchTrendingTokens();
  };

  // Show splash screen
  if (gameState.gamePhase === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Show loading state
  if (gameState.gamePhase === 'loading' || gameState.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-bounce-in">
            <div className="text-2xl">🛶</div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Loading Shiba Adventure</h2>
          <p className="text-gray-600">Preparing the stream and trending tokens...</p>
        </div>
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (gameState.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <div className="text-2xl">⚠️</div>
          </div>
          <p className="text-red-500 text-lg font-semibold">{gameState.error}</p>
          <p className="text-gray-600 mt-2">Please check your connection and try again.</p>
        </div>
        <Button onClick={() => {
          setGameState(prev => ({ ...prev, gamePhase: 'loading', error: null }));
          fetchTrendingTokens();
        }} className="bg-blue-500 hover:bg-blue-600">
          Try Again
        </Button>
      </div>
    );
  }

  if (gameState.gamePhase === 'gameOver') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-4 animate-bounce-in">
            <div className="text-3xl">💦</div>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Shiba Got Wet!</h2>
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm border border-gray-200">
            <div className="space-y-3">
              <p className="text-lg">
                <span className="font-semibold">Final Score:</span>
                <span className="ml-2 text-blue-600">{gameState.score}</span>
              </p>
              <p className="text-lg">
                <span className="font-semibold">$FLUD Earned:</span>
                <span className="ml-2 text-green-600">{gameState.fludEarned}</span>
              </p>
              <p className="text-sm text-gray-600">
                Tokens collected: {gameState.tokenPlatforms.filter(p => p.collected).length}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={restartGame} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
          Play Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="text-center animate-fade-in">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto">
          <div className="text-3xl">🛶</div>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Shiba Raft Adventure</h1>
        <p className="text-gray-600 mb-6">Help Shiba land on trending tokens to earn $FLUD!</p>
      </div>

      {/* Game Stats */}
      <div className="flex justify-between items-center w-full max-w-2xl bg-white rounded-lg p-4 shadow-md border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Score</p>
            <p className="text-lg font-bold text-blue-600">{gameState.score}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">$FLUD</p>
            <p className="text-lg font-bold text-green-600">{gameState.fludEarned}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Lives</p>
            <p className="text-lg font-bold text-red-600">{gameState.lives}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">Controls</p>
          <p className="text-xs text-gray-500">← → Move, Space Jump</p>
        </div>
      </div>

      {/* User Holdings Display */}
      <div className="w-full max-w-2xl animate-fade-in-up">
        <UserHoldings />
      </div>

      {/* Game Canvas */}
      <div 
        ref={gameRef}
        className="relative w-full max-w-2xl h-96 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-400 rounded-lg overflow-hidden border-4 border-blue-500 shadow-lg"
        style={{ backgroundImage: 'linear-gradient(to bottom, #87CEEB, #4682B4, #1E90FF)' }}
      >
        {/* Water animation */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
        </div>

        {/* Shiba Inu */}
        <div 
          className="absolute w-12 h-12 transition-transform duration-100"
          style={{
            left: `${gameState.shibaPosition.x}px`,
            top: `${gameState.shibaPosition.y}px`,
            transform: `translate(-50%, -50%)`
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg border-2 border-orange-700">
            <div className="text-2xl">🐕</div>
          </div>
          {/* Raft */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-yellow-600 rounded-full border border-yellow-700"></div>
        </div>

        {/* Token Platforms */}
        {gameState.tokenPlatforms.map((platform) => (
          <div
            key={platform.id}
            className={`absolute h-4 rounded-lg transition-all duration-300 ${
              platform.collected 
                ? 'bg-green-500 opacity-50' 
                : 'bg-gradient-to-r from-purple-400 to-pink-400 shadow-lg'
            }`}
            style={{
              left: `${platform.x}px`,
              top: `${platform.y}px`,
              width: `${platform.width}px`
            }}
          >
            {!platform.collected && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200">
                <img 
                  src={platform.token.img_url} 
                  alt={platform.token.symbol}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = '/icon.png';
                  }}
                />
              </div>
            )}
            {platform.collected && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl animate-bounce">
                💰
              </div>
            )}
          </div>
        ))}

        {/* Game Overlay */}
        {gameState.gamePhase === 'paused' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold mb-2">Game Paused</h3>
              <p className="text-gray-600">Press any key to continue</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center max-w-md animate-fade-in">
        Drift down the stream and collect trending tokens to earn $FLUD rewards! 🛶💎
      </p>
    </div>
  );
} 