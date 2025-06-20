"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button } from "./ui/Button";
import SplashScreen from "./SplashScreen";
import UserHoldings from "./UserHoldings";
import sdk from "@farcaster/frame-sdk";
import { useMiniApp } from "@neynar/react";
import Image from "next/image";

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
  gamePhase: 'splash' | 'loading' | 'playing' | 'burnRequired' | 'gameOver';
  score: number;
  fludEarned: number;
  loading: boolean;
  error: string | null;
  shibaPosition: { x: number; y: number };
  tokenPlatforms: Array<{
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    width: number;
    token: TrendingToken;
    collected: boolean;
    angle: number;
  }>;
  gameSpeed: number;
  lives: number;
  burstEffects: Array<{
    id: string;
    x: number;
    y: number;
    life: number;
  }>;
  isHoldingButton: boolean;
  multiplier: number;
  buttonSizzle: boolean;
  targetToken: string | null;
  moneyBags: Array<{
    id: string;
    x: number;
    y: number;
    life: number;
    isPositive: boolean;
  }>;
  lastMoneyBagTime: number;
  floodEffect: {
    active: boolean;
    direction: 'left' | 'right' | 'up' | 'down';
    position: number;
    intensity: number;
    duration: number;
  };
  lastFloodTime: number;
  floodCount: number;
  showLeaderboard: boolean;
  leaderboard: Array<{
    rank: number;
    username: string;
    score: number;
    fludEarned: number;
    avatar?: string;
  }>;
  isBurning: boolean;
  showConfetti: boolean;
}

export default function ShibaGame() {
  const { context } = useMiniApp();
  const [gameState, setGameState] = useState<GameState>({
    tokens: [],
    gamePhase: 'splash',
    score: 0,
    fludEarned: 0,
    loading: true,
    error: null,
    shibaPosition: { x: 100, y: 200 }, // Start on left side
    tokenPlatforms: [],
    gameSpeed: 2,
    lives: 3,
    burstEffects: [],
    isHoldingButton: false,
    multiplier: 1,
    buttonSizzle: false,
    targetToken: null,
    moneyBags: [],
    lastMoneyBagTime: 0,
    floodEffect: {
      active: false,
      direction: 'left',
      position: 0,
      intensity: 0,
      duration: 0
    },
    lastFloodTime: 0,
    floodCount: 0,
    showLeaderboard: false,
    leaderboard: [
      { rank: 1, username: "vitalik.eth", score: 15420, fludEarned: 2840, avatar: "🐋" },
      { rank: 2, username: "dwr.eth", score: 12850, fludEarned: 2150, avatar: "🚀" },
      { rank: 3, username: "punk6529", score: 11230, fludEarned: 1890, avatar: "🎨" },
      { rank: 4, username: "frankdegods", score: 9870, fludEarned: 1650, avatar: "👑" },
      { rank: 5, username: "beeple", score: 8540, fludEarned: 1420, avatar: "🎭" },
      { rank: 6, username: "garyvee", score: 7230, fludEarned: 1180, avatar: "💼" },
      { rank: 7, username: "naval", score: 6540, fludEarned: 980, avatar: "🧠" },
      { rank: 8, username: "balajis", score: 5890, fludEarned: 870, avatar: "⚡" },
      { rank: 9, username: "elonmusk", score: 5230, fludEarned: 720, avatar: "🚗" },
      { rank: 10, username: "saylor", score: 4670, fludEarned: 650, avatar: "💰" }
    ],
    isBurning: false,
    showConfetti: false
  });

  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [gameArea, setGameArea] = useState({ width: 1024, height: 384 }); // default to mobile size
  const [isMobile, setIsMobile] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  // Add useLayoutEffect to update gameArea on mount and resize:
  useLayoutEffect(() => {
    function updateGameArea() {
      if (gameRef.current) {
        const rect = gameRef.current.getBoundingClientRect();
        setGameArea({ width: rect.width, height: rect.height });
      }
    }
    updateGameArea();
    window.addEventListener("resize", updateGameArea);
    return () => window.removeEventListener("resize", updateGameArea);
  }, []);

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch trending tokens
  const fetchTrendingTokens = async () => {
    try {
      setGameState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/trending-tokens');
      if (!response.ok) {
        throw new Error('Failed to fetch trending tokens');
      }
      
      const tokens: TrendingToken[] = await response.json();
      
      // Create token platforms flowing from right to left
      const platforms = tokens.map((token, index) => {
        const maxY = 480; // Game container height minus margins
        const y = 60 + Math.random() * (maxY - 120); // Random vertical position
        const speed = 1.5 + Math.random() * 1; // Random speed
        return {
          id: token.id.toString(),
          x: 1050 + (index * 120) + Math.random() * 80, // Staggered right positions
          y: y,
          vx: -speed, // Move leftward
          vy: (Math.random() - 0.5) * 0.3, // Slight vertical drift
          width: 50 + Math.random() * 30,
          token,
          collected: false,
          angle: 0
        };
      });

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

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'loading' }));
    fetchTrendingTokens();
  };

  // Game loop
  useEffect(() => {
    if (gameState.gamePhase !== 'playing') return;

    const gameLoop = () => {
      setGameState(prev => {
        if (prev.gamePhase !== 'playing') return prev;

        // Update burst effects
        const newBurstEffects = prev.burstEffects
          .map(effect => ({ ...effect, life: effect.life - 1 }))
          .filter(effect => effect.life > 0);

        // Update money bags
        const currentTime = Date.now();
        const newMoneyBags = prev.moneyBags
          .map(bag => ({ ...bag, life: bag.life - 1 }))
          .filter(bag => bag.life > 0);

        // Update flood effect
        let newFloodEffect = { ...prev.floodEffect };
        let newLastFloodTime = prev.lastFloodTime;
        
        if (newFloodEffect.active) {
          newFloodEffect.duration -= 1;
          if (newFloodEffect.duration <= 0) {
            newFloodEffect.active = false;
            newFloodEffect.intensity = 0;
          } else {
            // Move flood wave
            const speed = 3;
            switch (newFloodEffect.direction) {
              case 'left':
                newFloodEffect.position -= speed;
                break;
              case 'right':
                newFloodEffect.position += speed;
                break;
              case 'up':
                newFloodEffect.position -= speed;
                break;
              case 'down':
                newFloodEffect.position += speed;
                break;
            }
          }
        } else {
          // Randomly spawn flood effect (every 8-15 seconds)
          if (currentTime - prev.lastFloodTime > 8000 + Math.random() * 7000) {
            const newFloodCount = prev.floodCount + 1;
            
            // Check if we need to trigger burn requirement
            if (newFloodCount >= 10) {
              setGameState(prev => ({
                ...prev,
                gamePhase: 'burnRequired',
                floodCount: newFloodCount
              }));
              return prev; // Return current state to avoid undefined
            }
            
            const directions: Array<'left' | 'right' | 'up' | 'down'> = ['left', 'right', 'up', 'down'];
            newFloodEffect = {
              active: true,
              direction: directions[Math.floor(Math.random() * directions.length)],
              position: newFloodEffect.direction === 'left' || newFloodEffect.direction === 'right' ? 850 : 450,
              intensity: 0.8 + Math.random() * 0.4,
              duration: 60 // 1 second at 60fps
            };
            newLastFloodTime = currentTime;
            
            // Update flood count
            return {
              ...prev,
              floodEffect: newFloodEffect,
              lastFloodTime: newLastFloodTime,
              floodCount: newFloodCount
            };
          }
        }

        // Spawn random money bags
        let newLastMoneyBagTime = prev.lastMoneyBagTime;
        if (currentTime - prev.lastMoneyBagTime > 3000) { // Every 3 seconds
          const isPositive = Math.random() > 0.6; // 40% chance of positive
          const maxX = 1000; // Game container width minus margins
          const maxY = 480; // Game container height minus margins
          const newBag = {
            id: `mb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            x: 60 + Math.random() * (maxX - 120),
            y: 60 + Math.random() * (maxY - 120),
            life: 60, // 1 second at 60fps
            isPositive: isPositive
          };
          newMoneyBags.push(newBag);
          newLastMoneyBagTime = currentTime;
        }

        // Move platforms from right to left
        const newPlatforms = prev.tokenPlatforms.map(platform => ({
          ...platform,
          x: platform.x + platform.vx,
          y: platform.y + platform.vy
        })).filter(platform => {
          // Remove if off the left side of the screen or collected
          return platform.x > -50 && !platform.collected;
        });

        // Move Shiba - always pushed left by current, but can swim right when holding button
        let newShibaX = prev.shibaPosition.x - 0.8; // Constant leftward drift (current)
        let newShibaY = prev.shibaPosition.y;
        let newTargetToken = prev.targetToken;

        if (prev.isHoldingButton) {
          // Find the closest uncollected token to swim towards
          const uncollectedTokens = newPlatforms.filter(p => !p.collected);
          if (uncollectedTokens.length > 0) {
            const closestToken = uncollectedTokens.reduce((closest, current) => {
              const closestDist = Math.sqrt(
                Math.pow(prev.shibaPosition.x - closest.x, 2) + 
                Math.pow(prev.shibaPosition.y - closest.y, 2)
              );
              const currentDist = Math.sqrt(
                Math.pow(prev.shibaPosition.x - current.x, 2) + 
                Math.pow(prev.shibaPosition.y - current.y, 2)
              );
              return currentDist < closestDist ? current : closest;
            });

            newTargetToken = closestToken.id;
            
            // Swim towards the target token
            const dx = closestToken.x - prev.shibaPosition.x;
            const dy = closestToken.y - prev.shibaPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              const swimSpeed = 2 * prev.multiplier; // Swim speed affected by multiplier
              newShibaX += (dx / distance) * swimSpeed;
              newShibaY += (dy / distance) * swimSpeed;
            }
          }
        }

        // Keep Shiba within bounds - optimized game area
        const inuSize = isMobile ? 56 : 80; // px
        const minX = inuSize / 2;
        const maxX = gameArea.width - inuSize / 2;
        const minY = inuSize / 2;
        const maxY = gameArea.height - inuSize / 2;
        
        // Apply flood effect bouncing
        if (newFloodEffect.active) {
          const floodRange = 80; // How close the flood needs to be to affect Shiba
          let inFloodRange = false;
          
          switch (newFloodEffect.direction) {
            case 'left':
              inFloodRange = Math.abs(newShibaX - newFloodEffect.position) < floodRange;
              if (inFloodRange) {
                newShibaX += newFloodEffect.intensity * 2; // Push right
                newShibaY += (Math.random() - 0.5) * newFloodEffect.intensity * 3; // Random vertical bounce
              }
              break;
            case 'right':
              inFloodRange = Math.abs(newShibaX - newFloodEffect.position) < floodRange;
              if (inFloodRange) {
                newShibaX -= newFloodEffect.intensity * 2; // Push left
                newShibaY += (Math.random() - 0.5) * newFloodEffect.intensity * 3; // Random vertical bounce
              }
              break;
            case 'up':
              inFloodRange = Math.abs(newShibaY - newFloodEffect.position) < floodRange;
              if (inFloodRange) {
                newShibaY += newFloodEffect.intensity * 2; // Push down
                newShibaX += (Math.random() - 0.5) * newFloodEffect.intensity * 3; // Random horizontal bounce
              }
              break;
            case 'down':
              inFloodRange = Math.abs(newShibaY - newFloodEffect.position) < floodRange;
              if (inFloodRange) {
                newShibaY -= newFloodEffect.intensity * 2; // Push up
                newShibaX += (Math.random() - 0.5) * newFloodEffect.intensity * 3; // Random horizontal bounce
              }
              break;
          }
        }
        
        newShibaX = Math.max(minX, Math.min(maxX, newShibaX));
        newShibaY = Math.max(minY, Math.min(maxY, newShibaY));

        // Check collisions
        let newScore = prev.score;
        let newFludEarned = prev.fludEarned;
        let newLives = prev.lives;
        let updatedBurstEffects = [...newBurstEffects];
        let newMultiplier = prev.multiplier;
        let newButtonSizzle = prev.buttonSizzle;
        let updatedMoneyBags = [...newMoneyBags];

        // Check money bag collisions
        for (const bag of updatedMoneyBags) {
          const distance = Math.sqrt(
            Math.pow(newShibaX - bag.x, 2) + 
            Math.pow(newShibaY - bag.y, 2)
          );
          
          if (distance < 60) {
            if (prev.isHoldingButton && bag.isPositive) {
              // Positive effect when holding button
              newScore += 200 * newMultiplier;
              newButtonSizzle = true;
            } else if (!prev.isHoldingButton && !bag.isPositive) {
              // Negative effect when not holding button
              newFludEarned = Math.max(0, newFludEarned - 333);
            }
            
            // Remove the bag
            bag.life = 0;
            
            // Add burst effect
            updatedBurstEffects.push({
              id: Date.now() + Math.random().toString(),
              x: bag.x,
              y: bag.y,
              life: 20
            });
          }
        }

        // Filter out collected money bags
        updatedMoneyBags = updatedMoneyBags.filter(bag => bag.life > 0);

        for (const platform of newPlatforms) {
          if (!platform.collected) {
            const distance = Math.sqrt(
              Math.pow(newShibaX - platform.x, 2) + 
              Math.pow(newShibaY - platform.y, 2)
            );
            
            if (distance < 60) { // Bigger collision radius for bigger Shiba
              // Collected token!
              platform.collected = true;
              newScore += 100 * newMultiplier;
              newFludEarned += Math.floor(Math.random() * 50 + 10) * newMultiplier;
              
              // Increase multiplier
              newMultiplier = Math.min(33, newMultiplier + 0.5);
              newButtonSizzle = true;
              
              // Add burst effect
              updatedBurstEffects.push({
                id: Date.now() + Math.random().toString(),
                x: platform.x,
                y: platform.y,
                life: 30
              });

              // Reset target token
              newTargetToken = null;
            }
          }
        }

        // Add new platforms if needed - cycle them back from the right
        if (newPlatforms.length < 8) {
          const maxY = window.innerWidth < 640 ? 250 : 350;
          const y = 50 + Math.random() * (maxY - 100);
          const speed = 1.5 + Math.random() * 1;
          const newPlatform = {
            id: Date.now().toString(),
            x: 450 + Math.random() * 100, // Start from right side
            y: y,
            vx: -speed, // Move leftward
            vy: (Math.random() - 0.5) * 0.3,
            width: 50 + Math.random() * 30,
            token: prev.tokens[Math.floor(Math.random() * prev.tokens.length)],
            collected: false,
            angle: 0
          };
          newPlatforms.push(newPlatform);
        }

        // Reset button sizzle after a short time
        if (newButtonSizzle) {
          setTimeout(() => {
            setGameState(current => ({ ...current, buttonSizzle: false }));
          }, 200);
        }

        return {
          ...prev,
          score: newScore,
          fludEarned: newFludEarned,
          shibaPosition: { x: newShibaX, y: newShibaY },
          tokenPlatforms: newPlatforms,
          burstEffects: updatedBurstEffects,
          multiplier: newMultiplier,
          buttonSizzle: newButtonSizzle,
          targetToken: newTargetToken,
          moneyBags: updatedMoneyBags,
          lastMoneyBagTime: newLastMoneyBagTime,
          floodEffect: newFloodEffect,
          lastFloodTime: newLastFloodTime
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

  const handleButtonDown = () => {
    setGameState(prev => ({ ...prev, isHoldingButton: true }));
  };

  const handleButtonUp = () => {
    setGameState(prev => ({ 
      ...prev, 
      isHoldingButton: false, 
      multiplier: 1, // Reset multiplier when not holding
      targetToken: null,
      buttonSizzle: true // Add sizzle effect when multiplier resets
    }));
    
    // Clear the sizzle effect after a short time
    setTimeout(() => {
      setGameState(current => ({ ...current, buttonSizzle: false }));
    }, 500);
  };

  const toggleLeaderboard = () => {
    setGameState(prev => ({ ...prev, showLeaderboard: !prev.showLeaderboard }));
  };

  // Fetch real leaderboard from API
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/scores');
      if (response.ok) {
        const leaderboard = await response.json();
        setGameState(prev => ({ ...prev, leaderboard }));
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  // Submit score to API when game ends
  const submitScore = async (score: number, fludEarned: number) => {
    if (!context?.user) {
      console.log('No user context available, skipping score submission');
      return;
    }

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fid: context.user.fid,
          username: context.user.username || context.user.displayName || 'Anonymous',
          score,
          fludEarned,
          avatar: context.user.pfpUrl
        }),
      });

      if (response.ok) {
        console.log('Score submitted successfully');
        // Refresh leaderboard after submitting score
        await fetchLeaderboard();
      } else {
        console.error('Failed to submit score');
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  // Fetch leaderboard on component mount
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Submit score when game ends
  useEffect(() => {
    if (gameState.gamePhase === 'gameOver' && context?.user) {
      submitScore(gameState.score, gameState.fludEarned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.gamePhase]);

  const restartGame = () => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'loading',
      score: 0,
      fludEarned: 0,
      lives: 3,
      shibaPosition: { x: 100, y: 200 },
      tokenPlatforms: [],
      burstEffects: [],
      isHoldingButton: false,
      multiplier: 1,
      buttonSizzle: false,
      targetToken: null,
      moneyBags: [],
      lastMoneyBagTime: 0,
      floodEffect: {
        active: false,
        direction: 'left',
        position: 0,
        intensity: 0,
        duration: 0
      },
      lastFloodTime: 0,
      floodCount: 0,
      showLeaderboard: false,
      isBurning: false,
      showConfetti: false
    }));
    fetchTrendingTokens();
  };

  // Handle burning $FLUD to continue
  const burnFludToContinue = () => {
    if (gameState.fludEarned >= 3000) {
      // Start burn effect
      setGameState(prev => ({
        ...prev,
        isBurning: true
      }));
      
      // After burn animation, continue game
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          fludEarned: prev.fludEarned - 3000,
          gamePhase: 'playing',
          floodCount: 0, // Reset flood count
          isBurning: false
        }));
      }, 3000); // 3 second burn animation
    }
  };

  // Handle "Do Not Pass Go" option
  const doNotPassGo = () => {
    // Add 3000 $$FLUD and show confetti
    setGameState(prev => ({
      ...prev,
      fludEarned: prev.fludEarned + 3000,
      showConfetti: true
    }));
    
    // Hide confetti after 3 seconds
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        showConfetti: false
      }));
    }, 3000);
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
            <div className="text-2xl">🌊</div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Loading River Adventure</h2>
          <p className="text-gray-600 mb-4">Preparing the flowing stream and trending tokens...</p>
          
          {/* Fun Lore */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-2">🐕 The Legend of Shiba the Trend Catcher</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Deep in the digital realm of Streme, a mighty river flows with the hottest crypto trends! 
              Our brave Shiba Inu must swim against the current to catch these precious tokens before 
              they drift away into the void. But beware - the river is treacherous, and only those 
              who hold strong can claim the $FLUD rewards! 🌊💎
            </p>
          </div>
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

  if (gameState.gamePhase === 'burnRequired') {
    const collectedTokens = gameState.tokenPlatforms.filter(p => p.collected);
    const uniqueTokens = collectedTokens.reduce((acc, platform) => {
      if (!acc.find(t => t.token.symbol === platform.token.symbol)) {
        acc.push(platform);
      }
      return acc;
    }, [] as typeof collectedTokens);

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center mb-4 animate-bounce-in">
            <div className="text-3xl">🔥</div>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">The Great $FLUD Burn!</h2>
          
          {/* Burn Lore */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200 max-w-md mx-auto mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">🌊 The River Demands Sacrifice!</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              After surviving 10 mighty floods, the Streme River demands tribute! 
              Burn 3,000 $$FLUD to prove your worth and continue your legendary journey. 
              Only the most dedicated trend catchers can proceed! 🔥💎
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm border border-gray-200">
            <div className="space-y-3">
              <p className="text-lg">
                <span className="font-semibold">Current Score:</span>
                <span className="ml-2 text-blue-600">{gameState.score}</span>
              </p>
              <p className="text-lg">
                <span className="font-semibold">$$FLUD Available:</span>
                <span className="ml-2 text-green-600">{gameState.fludEarned.toLocaleString()}</span>
              </p>
              <p className="text-lg">
                <span className="font-semibold">Burn Required:</span>
                <span className="ml-2 text-red-600">3,000 $$FLUD</span>
              </p>
              <p className="text-sm text-gray-600">
                Floods survived: {gameState.floodCount}/10
              </p>
            </div>
          </div>

          {/* Trending Tokens Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200 max-w-md mx-auto mt-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">🎯 Trending Tokens Collected</h3>
            <p className="text-sm text-gray-700 mb-3">
              You've collected {collectedTokens.length} tokens from {uniqueTokens.length} unique trending projects!
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {uniqueTokens.slice(0, 6).map((platform, index) => (
                <div key={index} className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full border border-purple-200">
                  <img 
                    src={platform.token.img_url} 
                    alt={platform.token.symbol}
                    className="w-4 h-4 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = '/icon.png';
                    }}
                  />
                  <span className="text-xs font-semibold text-gray-700">{platform.token.symbol}</span>
                </div>
              ))}
              {uniqueTokens.length > 6 && (
                <div className="text-xs text-gray-500">+{uniqueTokens.length - 6} more</div>
              )}
            </div>
            <a 
              href="https://streme.fun" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <span>🌊</span>
              <span>View on Streme.fun</span>
              <span>↗</span>
            </a>
          </div>
        </div>
        
        {gameState.fludEarned >= 3000 ? (
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={burnFludToContinue} 
              className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white animate-pulse"
            >
              🔥 Burn 3k $$FLUD & Continue 🔥
            </Button>
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={doNotPassGo} 
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              🎲 Do Not Pass Go - Collect 3k $$FLUD! 🎲
            </Button>
            <div className="text-center">
              <p className="text-red-600 font-semibold mb-2">❌ Insufficient $$FLUD</p>
              <p className="text-sm text-gray-600">You need {3000 - gameState.fludEarned} more $$FLUD to continue</p>
              <Button 
                onClick={restartGame} 
                className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                Start Over
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Wild Burn Effect Screen
  if (gameState.isBurning) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        {/* Fire background */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-900 via-orange-800 to-yellow-700 animate-pulse"></div>
        
        {/* Fire particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={`fire-particle-${i}`}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>

        {/* Burn animation */}
        <div className="relative text-center z-10">
          <div className="text-8xl mb-8 animate-bounce">🔥</div>
          <h1 className="text-4xl font-bold text-white mb-4 animate-pulse">BURNING $$FLUD!</h1>
          <div className="text-2xl text-yellow-300 mb-8 animate-spin">💸</div>
          <div className="text-xl text-white animate-pulse">
            The River accepts your sacrifice...
          </div>
          
          {/* Progress bar */}
          <div className="w-64 h-4 bg-red-800 rounded-full mt-8 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Floating $$FLUD symbols */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={`flud-symbol-${i}`}
              className="absolute text-green-400 font-bold animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '2s'
              }}
            >
              $$FLUD
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Confetti Effect Screen
  if (gameState.showConfetti) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        {/* Confetti background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={`confetti-${i}`}
              className={`absolute w-2 h-2 rounded-full animate-bounce ${
                ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400'][i % 6]
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>

        {/* Celebration content */}
        <div className="relative text-center z-10 bg-white rounded-lg p-8 shadow-2xl max-w-md mx-4">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">DO NOT PASS GO!</h1>
          <div className="text-2xl text-green-600 mb-4 animate-pulse">+3,000 $$FLUD</div>
          <p className="text-gray-600 mb-6">
            You've collected your $$FLUD bonus! The River rewards your clever strategy! 🌊💎
          </p>
          <div className="text-sm text-gray-500">
            Updated balance: {(gameState.fludEarned).toLocaleString()} $$FLUD
          </div>
        </div>

        {/* Floating $$FLUD symbols */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={`flud-celebration-${i}`}
              className="absolute text-green-400 font-bold animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1.5s'
              }}
            >
              $$FLUD
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gameState.gamePhase === 'gameOver') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 animate-bounce-in">
            <div className="text-3xl">🎉</div>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Great Swimming!</h2>
          
          {/* Victory Lore */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 max-w-md mx-auto mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">🏆 Legendary Achievement Unlocked!</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              You've proven yourself as a master of the Streme River! Your Shiba has braved the currents, 
              dodged the cursed bags, and captured the most valuable trends. The digital realm honors 
              your skill with precious $FLUD rewards! 🌊🐕💎
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm border border-gray-200">
            <div className="space-y-3">
              <p className="text-lg">
                <span className="font-semibold">Final Score:</span>
                <span className="ml-2 text-blue-600">{gameState.score}</span>
              </p>
              <p className="text-lg">
                <span className="font-semibold">$$FLUD Earned:</span>
                <span className="ml-2 text-green-600">{gameState.fludEarned}</span>
              </p>
              <p className="text-sm text-gray-600">
                Tokens collected: {gameState.tokenPlatforms.filter(p => p.collected).length}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={restartGame} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
          Swim Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 p-4">
      {/* Game Title and Info - Top */}
      <div className="text-center mb-4 animate-fade-in">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 mx-auto animate-crystal-shine">
          <div className="text-2xl animate-sparkle">🌊</div>
        </div>
        <h1 className="text-2xl font-bold mb-1 text-gray-800 animate-glow">$SuperInu River Swimmer</h1>
        <p className="text-gray-600 text-sm animate-pulse">Hold the button to swim against the current and catch tokens!</p>
      </div>

      {/* Game Stats Bar - Top */}
      <div className="w-full max-w-4xl bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 mb-4 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-700">Score</p>
              <p className="text-lg font-bold text-blue-600 animate-glow">{gameState.score}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-700">$$FLUD</p>
              <p className="text-lg font-bold text-green-600 animate-golden-glow">{gameState.fludEarned}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-700">Multiplier</p>
              <p className={`text-lg font-bold transition-all duration-300 ${
                gameState.multiplier > 1 
                  ? 'text-purple-600 animate-crystal-shine' 
                  : 'text-gray-500'
              }`}>
                x{gameState.multiplier.toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-700">Floods</p>
              <p className={`text-lg font-bold transition-all duration-300 ${
                gameState.floodCount >= 8 
                  ? 'text-red-600 animate-pulse' 
                  : gameState.floodCount >= 5
                  ? 'text-orange-600'
                  : 'text-blue-600'
              }`}>
                {gameState.floodCount}/10
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area - Optimized River View with Camera Follow on Mobile */}
      {isMobile ? (
        <div
          className="relative w-full h-96 max-w-full overflow-hidden border-4 border-blue-500 shadow-lg rounded-lg bg-gradient-to-b from-blue-200 via-blue-300 to-blue-400"
          style={{ backgroundImage: 'linear-gradient(to bottom, #87CEEB, #4682B4, #1E90FF)' }}
        >
          <div
            ref={gameRef}
            className="absolute left-0 top-0"
            style={{
              width: gameArea.width,
              height: gameArea.height,
              transform: `translate(${(viewport.width / 2) - gameState.shibaPosition.x}px, ${(384 / 2) - gameState.shibaPosition.y}px)`,
              transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1)'
            }}
          >
            {/* Leaderboard Button - Floating in top-right corner */}
            <button
              onClick={toggleLeaderboard}
              className="absolute top-3 right-3 z-40 bg-white bg-opacity-90 backdrop-blur-sm hover:bg-opacity-100 text-gray-700 hover:text-gray-900 px-3 py-1 rounded-full text-xs font-semibold shadow-lg border border-gray-200 transition-all duration-200 animate-crystal-shine"
            >
              {gameState.showLeaderboard ? '✕' : '🏆'} {gameState.showLeaderboard ? 'Close' : 'Leaderboard'}
            </button>

            {/* Background water flow animation */}
            <div className="absolute inset-0 opacity-25">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-water-flow"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-200 to-transparent opacity-20 animate-shimmer"></div>
            </div>

            {/* Floating sparkles in the water */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={`water-sparkle-${i}`}
                  className="absolute w-1 h-1 bg-white rounded-full animate-sparkle opacity-60"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '3s',
                    boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
                  }}
                />
              ))}
            </div>

            {/* Flood Effect */}
            {gameState.floodEffect.active && (
              <div 
                className="absolute pointer-events-none z-20"
                style={{
                  ...(gameState.floodEffect.direction === 'left' || gameState.floodEffect.direction === 'right' 
                    ? {
                        left: `${gameState.floodEffect.position}px`,
                        top: '0',
                        width: '120px',
                        height: '100%',
                        transform: 'translateX(-50%)'
                      }
                    : {
                        left: '0',
                        top: `${gameState.floodEffect.position}px`,
                        width: '100%',
                        height: '120px',
                        transform: 'translateY(-50%)'
                      }
                  )
                }}
              >
                {/* Enhanced Flood wave with sparkly effects */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 opacity-70 rounded-full shadow-2xl animate-flood-sparkle ${
                    gameState.floodEffect.direction === 'left' || gameState.floodEffect.direction === 'right'
                      ? 'animate-pulse'
                      : 'animate-bounce'
                  }`}
                  style={{
                    filter: 'blur(2px)',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(34, 211, 238, 0.6), 0 0 40px rgba(59, 130, 246, 0.4)'
                  }}
                />
                
                {/* Shimmer overlay for extra sparkle */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer rounded-full"></div>
                
                {/* Enhanced Flood particles with crystal effects */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={`flood-particle-${i}`}
                      className={`absolute w-2 h-2 bg-white rounded-full opacity-80 animate-sparkle ${
                        i % 3 === 0 ? 'animate-crystal-shine' : 'animate-ping'
                      }`}
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: i % 3 === 0 ? '2.5s' : '1s',
                        boxShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 12px rgba(34, 211, 238, 0.6)'
                      }}
                    />
                  ))}
                </div>
                
                {/* Enhanced Flood warning text with golden glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-lg font-bold bg-gradient-to-r from-red-600 via-orange-500 to-red-600 bg-opacity-90 px-4 py-2 rounded-full animate-golden-glow shadow-lg border border-yellow-300">
                    <span className="animate-sparkle">🌊</span>
                    <span className="mx-2 animate-pulse">$$FLUD!</span>
                    <span className="animate-sparkle" style={{ animationDelay: '0.5s' }}>🌊</span>
                  </div>
                </div>
              </div>
            )}

            {/* Flow direction indicator */}
            <div className="absolute top-2 left-2 text-white text-xs font-semibold bg-black bg-opacity-30 px-2 py-1 rounded z-10">
              ← Flow Direction
            </div>

            {/* Shiba Inu - Centered and larger */}
            <div 
              className="absolute w-16 h-16 sm:w-20 sm:h-20 transition-transform duration-200 z-30"
              style={{
                left: `${gameState.shibaPosition.x}px`,
                top: `${gameState.shibaPosition.y}px`,
                transform: `translate(-50%, -50%)`
              }}
            >
              <Image
                src="/stremeinu.png"
                alt="Shiba Inu"
                width={80}
                height={80}
                className="w-full h-full object-contain drop-shadow-lg"
              />
              {/* Raft */}
              <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 transform -translate-x-1/2 w-12 h-3 sm:w-16 sm:h-4 bg-yellow-600 rounded-full border border-yellow-700 shadow-md"></div>
              
              {/* Swimming indicator when holding button */}
              {gameState.isHoldingButton && (
                <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 text-xl sm:text-2xl animate-bounce">
                  🏊‍♂️
                </div>
              )}
            </div>

            {/* Token Platforms flowing from right to left */}
            {gameState.tokenPlatforms.map((platform) => (
              <div
                key={`token-${platform.id}-${platform.x}-${platform.y}`}
                className={`absolute h-6 sm:h-8 rounded-lg transition-all duration-300 z-20 ${
                  platform.collected 
                    ? 'bg-green-500 opacity-50' 
                    : platform.id === gameState.targetToken
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg border-2 border-yellow-500 animate-golden-glow'
                    : 'bg-gradient-to-r from-purple-400 to-pink-400 shadow-lg border border-purple-500 animate-crystal-shine'
                }`}
                style={{
                  left: `${platform.x}px`,
                  top: `${platform.y}px`,
                  width: `${platform.width}px`,
                  transform: `translate(-50%, -50%)`
                }}
              >
                {!platform.collected && (
                  <>
                    <div className="absolute -top-10 sm:-top-12 left-1/2 transform -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-gray-200 animate-float">
                      <img 
                        src={platform.token.img_url} 
                        alt={platform.token.symbol}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = '/icon.png';
                        }}
                      />
                      {/* Shimmer effect on token images */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer rounded-full"></div>
                    </div>
                    {/* Ticker Symbol with enhanced styling */}
                    <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs sm:text-sm font-bold px-2 py-1 rounded-full whitespace-nowrap shadow-lg border border-white animate-glow">
                      {platform.token.symbol}
                    </div>
                  </>
                )}
                {platform.collected && (
                  <div className="absolute -top-10 sm:-top-12 left-1/2 transform -translate-x-1/2 text-2xl sm:text-3xl animate-bounce">
                    💰
                  </div>
                )}
              </div>
            ))}

            {/* Enhanced Burst Effects with sparkly animations */}
            {gameState.burstEffects.map((effect) => (
              <div
                key={effect.id}
                className="absolute pointer-events-none z-40"
                style={{
                  left: `${effect.x}px`,
                  top: `${effect.y}px`,
                  transform: `translate(-50%, -50%) scale(${1 + (30 - effect.life) / 30})`,
                  opacity: effect.life / 30
                }}
              >
                <div className="text-2xl sm:text-3xl animate-sparkle">✨</div>
                <div className="text-xl sm:text-2xl animate-crystal-shine" style={{ animationDelay: '0.1s' }}>💎</div>
                <div className="text-lg sm:text-xl animate-golden-glow" style={{ animationDelay: '0.2s' }}>💰</div>
                <div className="text-base sm:text-lg animate-float" style={{ animationDelay: '0.3s' }}>🔥</div>
                
                {/* Additional sparkle particles */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={`burst-sparkle-${i}`}
                    className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-sparkle"
                    style={{
                      left: `${(Math.random() - 0.5) * 40}px`,
                      top: `${(Math.random() - 0.5) * 40}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '1.5s',
                      boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
                    }}
                  />
                ))}
              </div>
            ))}

            {/* Enhanced Money Bags with sparkly effects */}
            {gameState.moneyBags.map((bag) => (
              <div
                key={bag.id}
                className={`absolute w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg border-4 transition-all duration-300 z-20 ${
                  bag.isPositive 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 border-green-600 animate-golden-glow' 
                    : 'bg-gradient-to-r from-red-400 to-red-500 border-red-600 animate-pulse'
                }`}
                style={{
                  left: `${bag.x}px`,
                  top: `${bag.y}px`,
                  transform: `translate(-50%, -50%) scale(${1 + (60 - bag.life) / 60})`,
                  opacity: bag.life / 60
                }}
              >
                <div className="text-lg sm:text-xl animate-sparkle">
                  {bag.isPositive ? '💰' : '💸'}
                </div>
                <div className={`absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 text-xs sm:text-sm font-bold ${
                  bag.isPositive ? 'text-green-600' : 'text-red-600'
                } animate-float`}>
                  {bag.isPositive ? '+200' : '-333'}
                </div>
                
                {/* Sparkle trail for positive bags */}
                {bag.isPositive && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={`bag-sparkle-${i}`}
                        className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-sparkle"
                        style={{
                          left: `${(Math.random() - 0.5) * 30}px`,
                          top: `${(Math.random() - 0.5) * 30}px`,
                          animationDelay: `${i * 0.2}s`,
                          animationDuration: '2s',
                          boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div 
          ref={gameRef}
          className="relative w-full max-w-4xl h-96 sm:h-[500px] bg-gradient-to-b from-blue-200 via-blue-300 to-blue-400 rounded-lg overflow-hidden border-4 border-blue-500 shadow-lg"
          style={{ backgroundImage: 'linear-gradient(to bottom, #87CEEB, #4682B4, #1E90FF)' }}
        >
          {/* Leaderboard Button - Floating in top-right corner */}
          <button
            onClick={toggleLeaderboard}
            className="absolute top-3 right-3 z-40 bg-white bg-opacity-90 backdrop-blur-sm hover:bg-opacity-100 text-gray-700 hover:text-gray-900 px-3 py-1 rounded-full text-xs font-semibold shadow-lg border border-gray-200 transition-all duration-200 animate-crystal-shine"
          >
            {gameState.showLeaderboard ? '✕' : '🏆'} {gameState.showLeaderboard ? 'Close' : 'Leaderboard'}
          </button>

          {/* Background water flow animation */}
          <div className="absolute inset-0 opacity-25">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-water-flow"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-200 to-transparent opacity-20 animate-shimmer"></div>
          </div>

          {/* Floating sparkles in the water */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={`water-sparkle-${i}`}
                className="absolute w-1 h-1 bg-white rounded-full animate-sparkle opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '3s',
                  boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
                }}
              />
            ))}
          </div>

          {/* Flood Effect */}
          {gameState.floodEffect.active && (
            <div 
              className="absolute pointer-events-none z-20"
              style={{
                ...(gameState.floodEffect.direction === 'left' || gameState.floodEffect.direction === 'right' 
                  ? {
                      left: `${gameState.floodEffect.position}px`,
                      top: '0',
                      width: '120px',
                      height: '100%',
                      transform: 'translateX(-50%)'
                    }
                  : {
                      left: '0',
                      top: `${gameState.floodEffect.position}px`,
                      width: '100%',
                      height: '120px',
                      transform: 'translateY(-50%)'
                    }
              )
            }}
          >
            {/* Enhanced Flood wave with sparkly effects */}
            <div 
              className={`absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 opacity-70 rounded-full shadow-2xl animate-flood-sparkle ${
                gameState.floodEffect.direction === 'left' || gameState.floodEffect.direction === 'right'
                  ? 'animate-pulse'
                  : 'animate-bounce'
              }`}
              style={{
                filter: 'blur(2px)',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(34, 211, 238, 0.6), 0 0 40px rgba(59, 130, 246, 0.4)'
              }}
            />
            
            {/* Shimmer overlay for extra sparkle */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer rounded-full"></div>
            
            {/* Enhanced Flood particles with crystal effects */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <div
                  key={`flood-particle-${i}`}
                  className={`absolute w-2 h-2 bg-white rounded-full opacity-80 animate-sparkle ${
                    i % 3 === 0 ? 'animate-crystal-shine' : 'animate-ping'
                  }`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: i % 3 === 0 ? '2.5s' : '1s',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 12px rgba(34, 211, 238, 0.6)'
                  }}
                />
              ))}
            </div>
            
            {/* Enhanced Flood warning text with golden glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-lg font-bold bg-gradient-to-r from-red-600 via-orange-500 to-red-600 bg-opacity-90 px-4 py-2 rounded-full animate-golden-glow shadow-lg border border-yellow-300">
                <span className="animate-sparkle">🌊</span>
                <span className="mx-2 animate-pulse">$$FLUD!</span>
                <span className="animate-sparkle" style={{ animationDelay: '0.5s' }}>🌊</span>
              </div>
            </div>
          </div>
        )}

        {/* Flow direction indicator */}
        <div className="absolute top-2 left-2 text-white text-xs font-semibold bg-black bg-opacity-30 px-2 py-1 rounded z-10">
          ← Flow Direction
        </div>

        {/* Shiba Inu - Centered and larger */}
        <div 
          className="absolute w-16 h-16 sm:w-20 sm:h-20 transition-transform duration-200 z-30"
          style={{
            left: `${gameState.shibaPosition.x}px`,
            top: `${gameState.shibaPosition.y}px`,
            transform: `translate(-50%, -50%)`
          }}
        >
          <Image
            src="/stremeinu.png"
            alt="Shiba Inu"
            width={80}
            height={80}
            className="w-full h-full object-contain drop-shadow-lg"
          />
          {/* Raft */}
          <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 transform -translate-x-1/2 w-12 h-3 sm:w-16 sm:h-4 bg-yellow-600 rounded-full border border-yellow-700 shadow-md"></div>
          
          {/* Swimming indicator when holding button */}
          {gameState.isHoldingButton && (
            <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 text-xl sm:text-2xl animate-bounce">
              🏊‍♂️
            </div>
          )}
        </div>

        {/* Token Platforms flowing from right to left */}
        {gameState.tokenPlatforms.map((platform) => (
          <div
            key={`token-${platform.id}-${platform.x}-${platform.y}`}
            className={`absolute h-6 sm:h-8 rounded-lg transition-all duration-300 z-20 ${
              platform.collected 
                ? 'bg-green-500 opacity-50' 
                : platform.id === gameState.targetToken
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg border-2 border-yellow-500 animate-golden-glow'
                : 'bg-gradient-to-r from-purple-400 to-pink-400 shadow-lg border border-purple-500 animate-crystal-shine'
            }`}
            style={{
              left: `${platform.x}px`,
              top: `${platform.y}px`,
              width: `${platform.width}px`,
              transform: `translate(-50%, -50%)`
            }}
          >
            {!platform.collected && (
              <>
                <div className="absolute -top-10 sm:-top-12 left-1/2 transform -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-gray-200 animate-float">
                  <img 
                    src={platform.token.img_url} 
                    alt={platform.token.symbol}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = '/icon.png';
                    }}
                  />
                  {/* Shimmer effect on token images */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer rounded-full"></div>
                </div>
                {/* Ticker Symbol with enhanced styling */}
                <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs sm:text-sm font-bold px-2 py-1 rounded-full whitespace-nowrap shadow-lg border border-white animate-glow">
                  {platform.token.symbol}
                </div>
              </>
            )}
            {platform.collected && (
              <div className="absolute -top-10 sm:-top-12 left-1/2 transform -translate-x-1/2 text-2xl sm:text-3xl animate-bounce">
                💰
              </div>
            )}
          </div>
        ))}

        {/* Enhanced Burst Effects with sparkly animations */}
        {gameState.burstEffects.map((effect) => (
          <div
            key={effect.id}
            className="absolute pointer-events-none z-40"
            style={{
              left: `${effect.x}px`,
              top: `${effect.y}px`,
              transform: `translate(-50%, -50%) scale(${1 + (30 - effect.life) / 30})`,
              opacity: effect.life / 30
            }}
          >
            <div className="text-2xl sm:text-3xl animate-sparkle">✨</div>
            <div className="text-xl sm:text-2xl animate-crystal-shine" style={{ animationDelay: '0.1s' }}>💎</div>
            <div className="text-lg sm:text-xl animate-golden-glow" style={{ animationDelay: '0.2s' }}>💰</div>
            <div className="text-base sm:text-lg animate-float" style={{ animationDelay: '0.3s' }}>🔥</div>
            
            {/* Additional sparkle particles */}
            {[...Array(6)].map((_, i) => (
              <div
                key={`burst-sparkle-${i}`}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-sparkle"
                style={{
                  left: `${(Math.random() - 0.5) * 40}px`,
                  top: `${(Math.random() - 0.5) * 40}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1.5s',
                  boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
                }}
              />
            ))}
          </div>
        ))}

        {/* Enhanced Money Bags with sparkly effects */}
        {gameState.moneyBags.map((bag) => (
          <div
            key={bag.id}
            className={`absolute w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg border-4 transition-all duration-300 z-20 ${
              bag.isPositive 
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 border-green-600 animate-golden-glow' 
                : 'bg-gradient-to-r from-red-400 to-red-500 border-red-600 animate-pulse'
            }`}
            style={{
              left: `${bag.x}px`,
              top: `${bag.y}px`,
              transform: `translate(-50%, -50%) scale(${1 + (60 - bag.life) / 60})`,
              opacity: bag.life / 60
            }}
          >
            <div className="text-lg sm:text-xl animate-sparkle">
              {bag.isPositive ? '💰' : '💸'}
            </div>
            <div className={`absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 text-xs sm:text-sm font-bold ${
              bag.isPositive ? 'text-green-600' : 'text-red-600'
            } animate-float`}>
              {bag.isPositive ? '+200' : '-333'}
            </div>
            
            {/* Sparkle trail for positive bags */}
            {bag.isPositive && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={`bag-sparkle-${i}`}
                    className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-sparkle"
                    style={{
                      left: `${(Math.random() - 0.5) * 30}px`,
                      top: `${(Math.random() - 0.5) * 30}px`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '2s',
                      boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {/* Enhanced Hold Button - Below Game Area */}
      <div className="flex flex-col items-center space-y-3 mt-4">
        <button
          ref={buttonRef}
          onMouseDown={handleButtonDown}
          onMouseUp={handleButtonUp}
          onTouchStart={handleButtonDown}
          onTouchEnd={handleButtonUp}
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg transition-all duration-200 ${
            gameState.isHoldingButton 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 scale-110 shadow-xl animate-glow' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105 animate-crystal-shine'
          } ${
            gameState.buttonSizzle 
              ? 'animate-pulse ring-4 ring-yellow-400 ring-opacity-75' 
              : ''
          }`}
        >
          {gameState.isHoldingButton ? '🏊‍♂️' : '💪'}
          
          {/* Shimmer effect on button */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer rounded-full"></div>
        </button>
        
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700 animate-pulse">
            {gameState.isHoldingButton ? 'Swimming!' : 'Hold to Swim'}
          </p>
        </div>
      </div>

      {/* Leaderboard Overlay */}
      {gameState.showLeaderboard && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200 z-50 max-w-sm animate-fade-in">
          <h3 className="text-lg font-bold text-gray-800 mb-3 text-center animate-glow">
            <span className="animate-sparkle">🏆</span> Streme River Champions <span className="animate-sparkle" style={{ animationDelay: '0.5s' }}>🏆</span>
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {gameState.leaderboard.map((player) => (
              <div
                key={player.rank}
                className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${
                  player.rank <= 3 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 animate-golden-glow' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    player.rank === 1 ? 'bg-yellow-400 text-white animate-sparkle' :
                    player.rank === 2 ? 'bg-gray-300 text-white animate-crystal-shine' :
                    player.rank === 3 ? 'bg-orange-400 text-white animate-glow' :
                    'bg-blue-500 text-white'
                  }`}>
                    {player.rank}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg animate-float">{player.avatar}</span>
                    <span className="font-semibold text-gray-800">@{player.username}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600 animate-glow">{player.score.toLocaleString()}</div>
                  <div className="text-xs text-green-600 animate-golden-glow">{player.fludEarned} $$FLUD</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Holdings Display - Bottom */}
      <div className="w-full max-w-4xl mt-4 animate-fade-in-up">
        <UserHoldings />
      </div>
    </div>
  );
} 