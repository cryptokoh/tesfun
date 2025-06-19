import { getNeynarClient } from './neynar';

interface TokenBalance {
  tokenAddress: string;
  symbol: string;
  balance: string;
  decimals: number;
  usdValue?: number;
}

interface UserHoldings {
  hasHoldings: boolean;
  tokens: TokenBalance[];
  totalValue?: number;
}

// Check if user holds any of the trending tokens
export async function checkUserTokenHoldings(
  userAddress: string,
  trendingTokens: any[]
): Promise<UserHoldings> {
  try {
    const holdings: TokenBalance[] = [];
    let totalValue = 0;

    // For each trending token, check if user holds it
    for (const token of trendingTokens) {
      try {
        // Try to get token contract address from the token data
        const tokenAddress = token.contractAddress || token.address;
        
        if (tokenAddress) {
          // Check balance using Etherscan API (for Ethereum tokens)
          const balance = await checkEthereumTokenBalance(userAddress, tokenAddress, token.symbol);
          
          if (balance && parseFloat(balance.balance) > 0) {
            holdings.push(balance);
            if (balance.usdValue) {
              totalValue += balance.usdValue;
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to check balance for ${token.symbol}:`, error);
      }
    }

    return {
      hasHoldings: holdings.length > 0,
      tokens: holdings,
      totalValue: totalValue > 0 ? totalValue : undefined
    };
  } catch (error) {
    console.error('Error checking user token holdings:', error);
    return {
      hasHoldings: false,
      tokens: []
    };
  }
}

// Check Ethereum token balance using Etherscan API
async function checkEthereumTokenBalance(
  userAddress: string, 
  tokenAddress: string, 
  symbol: string
): Promise<TokenBalance | null> {
  try {
    // Use Etherscan API to get token balance
    const response = await fetch(
      `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${tokenAddress}&address=${userAddress}&tag=latest&apikey=${process.env.ETHERSCAN_API_KEY || 'demo'}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch token balance');
    }

    const data = await response.json();
    
    if (data.status === '1' && data.result) {
      const balance = data.result;
      const decimals = 18; // Most ERC-20 tokens use 18 decimals
      const formattedBalance = (parseInt(balance) / Math.pow(10, decimals)).toString();
      
      return {
        tokenAddress,
        symbol,
        balance: formattedBalance,
        decimals
      };
    }

    return null;
  } catch (error) {
    console.warn(`Error checking Ethereum balance for ${symbol}:`, error);
    return null;
  }
}

// Get user's connected wallet address (placeholder - would integrate with wallet providers)
export async function getUserWalletAddress(fid?: number): Promise<string | null> {
  try {
    // For now, return a demo address for testing
    // In a real app, this would integrate with wallet providers like MetaMask, WalletConnect, etc.
    // or get verified addresses from Neynar API
    return '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
  } catch (error) {
    console.warn('Error getting user wallet address:', error);
    return null;
  }
}

// Mock function for demo purposes - in real app, this would connect to user's wallet
export function getConnectedWalletAddress(): string | null {
  // This would integrate with wallet providers like MetaMask, WalletConnect, etc.
  // For now, return a demo address for testing
  return '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
} 