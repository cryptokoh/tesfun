"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/Button";

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
}

interface GameState {
  tokens: TrendingToken[];
  selectedToken: TrendingToken | null;
  gamePhase: 'selecting' | 'waiting' | 'result';
  score: number;
  loading: boolean;
  error: string | null;
}

export default function TokenGame() {
  const [gameState, setGameState] = useState<GameState>({
    tokens: [],
    selectedToken: null,
    gamePhase: 'selecting',
    score: 0,
    loading: true,
    error: null
  });

  // Fetch trending tokens
  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        setGameState(prev => ({ ...prev, loading: true, error: null }));
        
        const response = await fetch('https://api.streme.fun/api/tokens/trending');
        if (!response.ok) {
          throw new Error('Failed to fetch trending tokens');
        }
        
        const tokens: TrendingToken[] = await response.json();
        
        // Filter tokens with valid market data and take top 4
        const validTokens = tokens
          .filter(token => token.marketData && token.marketData.price > 0)
          .slice(0, 4);
        
        setGameState(prev => ({
          ...prev,
          tokens: validTokens,
          loading: false
        }));
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setGameState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load trending tokens'
        }));
      }
    };

    fetchTrendingTokens();
  }, []);

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

  if (gameState.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-lg font-semibold">Loading trending tokens...</p>
      </div>
    );
  }

  if (gameState.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-500 text-lg">{gameState.error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (gameState.gamePhase === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Waiting for Results...</h2>
          <p className="text-gray-600">You selected: <span className="font-semibold">{gameState.selectedToken?.name} ({gameState.selectedToken?.symbol})</span></p>
        </div>
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto"></div>
        </div>
        <p className="text-sm text-gray-500">Checking price performance...</p>
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
          <h2 className="text-2xl font-bold mb-4">Game Result!</h2>
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm">
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
            </div>
          </div>
          <div className="mt-4">
            <p className="text-lg font-semibold">Score: {gameState.score}</p>
          </div>
        </div>
        <Button onClick={playAgain} className="bg-blue-500 hover:bg-blue-600">
          Play Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🎯 Token Price Prediction Game</h1>
        <p className="text-gray-600 mb-6">Pick the token you think will perform best in the next hour!</p>
        <p className="text-sm text-gray-500 mb-4">Current Score: {gameState.score}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        {gameState.tokens.map((token) => (
          <div
            key={token.id}
            className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300"
            onClick={() => selectToken(token)}
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

      <p className="text-xs text-gray-400 text-center max-w-md">
        Data from <a href="https://api.streme.fun/api/tokens/trending" target="_blank" rel="noopener noreferrer" className="underline">Streme Trending Tokens API</a>
      </p>
    </div>
  );
} 