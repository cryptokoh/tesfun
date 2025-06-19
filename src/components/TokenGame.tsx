"use client";

import { useState, useEffect } from "react";
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
  selectedToken: TrendingToken | null;
  gamePhase: 'splash' | 'loading' | 'selecting' | 'waiting' | 'result';
  score: number;
  loading: boolean;
  error: string | null;
}

export default function TokenGame() {
  const [gameState, setGameState] = useState<GameState>({
    tokens: [],
    selectedToken: null,
    gamePhase: 'splash',
    score: 0,
    loading: true,
    error: null
  });

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'loading' }));
    fetchTrendingTokens();
  };

  // Fetch trending tokens
  const fetchTrendingTokens = async () => {
    try {
      setGameState(prev => ({ ...prev, loading: true, error: null }));
      
      // Use our new enriched API endpoint
      const response = await fetch('/api/trending-tokens');
      if (!response.ok) {
        throw new Error('Failed to fetch trending tokens');
      }
      
      const tokens: TrendingToken[] = await response.json();
      
      setGameState(prev => ({
        ...prev,
        tokens: tokens,
        loading: false,
        gamePhase: 'selecting'
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

  const selectToken = (token: TrendingToken) => {
    setGameState(prev => ({
      ...prev,
      selectedToken: token,
      gamePhase: 'waiting'
    }));

    // Simulate waiting period (in real app, this would be actual time)
    setTimeout(() => {
      calculateResult(token);
    }, 3000);
  };

  const calculateResult = (selectedToken: TrendingToken) => {
    // Simple scoring based on 1h price change
    const priceChange = selectedToken.marketData.priceChange1h;
    let points = 0;
    
    if (priceChange > 5) points = 100;
    else if (priceChange > 0) points = 50;
    else if (priceChange > -5) points = 25;
    else points = 10;

    setGameState(prev => ({
      ...prev,
      score: prev.score + points,
      gamePhase: 'result'
    }));
  };

  const playAgain = () => {
    setGameState(prev => ({
      ...prev,
      selectedToken: null,
      gamePhase: 'selecting'
    }));
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
            <div className="text-2xl">🎯</div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Loading Game</h2>
          <p className="text-gray-600">Fetching the latest trending tokens...</p>
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

  if (gameState.gamePhase === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <div className="text-3xl">⏳</div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Analyzing Results...</h2>
          <p className="text-gray-600">You selected: <span className="font-semibold">{gameState.selectedToken?.name} ({gameState.selectedToken?.symbol})</span></p>
        </div>
        <div className="space-y-2">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-sm text-gray-500">Checking price performance...</p>
        </div>
      </div>
    );
  }

  if (gameState.gamePhase === 'result') {
    const token = gameState.selectedToken!;
    const priceChange = token.marketData.priceChange1h;
    const isPositive = priceChange > 0;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 animate-bounce-in">
            <div className="text-3xl">🎉</div>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Game Result!</h2>
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={token.img_url} 
                alt={token.name}
                className="w-12 h-12 rounded-full"
                onError={(e) => {
                  e.currentTarget.src = '/icon.png';
                }}
              />
              <div>
                <h3 className="font-bold text-lg">{token.name}</h3>
                <p className="text-gray-600">{token.symbol}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-semibold">Price Change (1h):</span>
                <span className={`ml-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </p>
              <p className="text-sm">
                <span className="font-semibold">Market Cap:</span>
                <span className="ml-2">${token.marketData.marketCap.toLocaleString()}</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold">Volume (24h):</span>
                <span className="ml-2">${token.marketData.volume24h.toLocaleString()}</span>
              </p>
              {token.neynarData && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Creator Info:</p>
                  <p className="text-sm">
                    <span className="font-semibold">Followers:</span>
                    <span className="ml-2">{token.neynarData.followers?.toLocaleString() || 'N/A'}</span>
                  </p>
                  {token.neynarData.bio && (
                    <p className="text-xs text-gray-600 mt-1 truncate">{token.neynarData.bio}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-lg font-semibold text-gray-800">Score: {gameState.score}</p>
          </div>
        </div>
        <Button onClick={playAgain} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
          Play Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="text-center animate-fade-in">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto">
          <div className="text-3xl">🎯</div>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Token Price Prediction Game</h1>
        <p className="text-gray-600 mb-6">Pick the token you think will perform best in the next hour!</p>
        <p className="text-sm text-gray-500 mb-4">Current Score: {gameState.score}</p>
      </div>

      {/* User Holdings Display */}
      <div className="w-full max-w-2xl animate-fade-in-up">
        <UserHoldings />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full animate-fade-in-up">
        {gameState.tokens.map((token, index) => (
          <div
            key={token.id}
            className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-300 transform hover:scale-105"
            onClick={() => selectToken(token)}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center space-x-3">
              <img 
                src={token.img_url} 
                alt={token.name}
                className="w-12 h-12 rounded-full"
                onError={(e) => {
                  e.currentTarget.src = '/icon.png';
                }}
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg">{token.name}</h3>
                <p className="text-gray-600 text-sm">{token.symbol}</p>
                <p className="text-xs text-gray-500">by @{token.username}</p>
                {token.neynarData && (
                  <p className="text-xs text-blue-600">
                    {token.neynarData.followers?.toLocaleString() || 'N/A'} followers
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Price:</span>
                <span>${token.marketData.price.toFixed(8)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Market Cap:</span>
                <span>${(token.marketData.marketCap / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>24h Change:</span>
                <span className={token.marketData.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}>
                  {token.marketData.priceChange24h > 0 ? '+' : ''}{token.marketData.priceChange24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center max-w-md animate-fade-in">
        Data from <a href="https://api.streme.fun/api/tokens/trending" target="_blank" rel="noopener noreferrer" className="underline">Streme API</a> 
        {process.env.NODE_ENV === 'development' && ' + Neynar enrichment'}
      </p>
    </div>
  );
} 