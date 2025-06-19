"use client";

import { useState, useEffect } from "react";

interface TokenBalance {
  tokenAddress: string;
  symbol: string;
  balance: string;
  decimals: number;
  usdValue?: number;
}

interface UserHoldings {
  walletAddress: string;
  hasHoldings: boolean;
  tokens: TokenBalance[];
  totalValue?: number;
}

interface UserHoldingsProps {
  fid?: number;
  userAddress?: string;
}

export default function UserHoldings({ fid, userAddress }: UserHoldingsProps) {
  const [holdings, setHoldings] = useState<UserHoldings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fid || userAddress) {
      checkHoldings();
    }
  }, [fid, userAddress]);

  const checkHoldings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (fid) params.append('fid', fid.toString());
      if (userAddress) params.append('address', userAddress);
      
      const response = await fetch(`/api/user-holdings?${params}`);
      if (!response.ok) {
        throw new Error('Failed to check holdings');
      }
      
      const data = await response.json();
      setHoldings(data);
    } catch (error) {
      console.error('Error checking holdings:', error);
      setError('Failed to check your token holdings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200 animate-fade-in">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Checking your holdings...</p>
            <p className="text-xs text-gray-500">Looking for trending tokens in your wallet</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-4 shadow-md border border-red-200 animate-fade-in">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <div className="text-red-500 text-sm">⚠️</div>
          </div>
          <div>
            <p className="text-sm font-medium text-red-700">Error checking holdings</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!holdings) {
    return null;
  }

  if (!holdings.hasHoldings) {
    return (
      <div className="bg-blue-50 rounded-lg p-4 shadow-md border border-blue-200 animate-fade-in">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="text-blue-500 text-sm">💼</div>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700">No holdings found</p>
            <p className="text-xs text-blue-600">
              You don't hold any of the current trending tokens
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 rounded-lg p-4 shadow-md border border-green-200 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <div className="text-green-500 text-sm">🎉</div>
          </div>
          <div>
            <p className="text-sm font-medium text-green-700">You hold trending tokens!</p>
            <p className="text-xs text-green-600">
              {holdings.tokens.length} token{holdings.tokens.length > 1 ? 's' : ''} found
            </p>
          </div>
        </div>
        {holdings.totalValue && (
          <div className="text-right">
            <p className="text-sm font-bold text-green-700">
              ${holdings.totalValue.toFixed(2)}
            </p>
            <p className="text-xs text-green-600">Total Value</p>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        {holdings.tokens.map((token, index) => (
          <div 
            key={token.tokenAddress}
            className="bg-white rounded-lg p-3 border border-green-100 animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs font-bold">{token.symbol}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{token.symbol}</p>
                  <p className="text-xs text-gray-500">
                    Balance: {parseFloat(token.balance).toLocaleString()}
                  </p>
                </div>
              </div>
              {token.usdValue && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">
                    ${token.usdValue.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-green-200">
        <p className="text-xs text-green-600">
          Wallet: {holdings.walletAddress.slice(0, 6)}...{holdings.walletAddress.slice(-4)}
        </p>
      </div>
    </div>
  );
} 