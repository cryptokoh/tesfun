import { NextResponse } from 'next/server';
import { getNeynarClient } from '~/lib/neynar';

interface StremeToken {
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

interface EnrichedToken extends StremeToken {
  neynarData?: {
    followers?: number;
    following?: number;
    bio?: string;
  };
}

export async function GET() {
  try {
    // Fetch trending tokens from Streme API
    const stremeResponse = await fetch('https://api.streme.fun/api/tokens/trending', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!stremeResponse.ok) {
      throw new Error(`Streme API error: ${stremeResponse.statusText}`);
    }

    const stremeTokens: StremeToken[] = await stremeResponse.json();
    
    // Filter tokens with valid market data and take top 4
    const validTokens = stremeTokens
      .filter(token => token.marketData && token.marketData.price > 0)
      .slice(0, 4);

    // Enrich with Neynar data if API key is available
    const enrichedTokens: EnrichedToken[] = [];
    
    if (process.env.NEYNAR_API_KEY) {
      try {
        const neynarClient = getNeynarClient();
        
        // Get usernames from tokens
        const usernames = validTokens.map(token => token.username).filter(Boolean);
        
        if (usernames.length > 0) {
          // Create a map of username to Neynar data
          const neynarDataMap = new Map();
          
          for (const username of usernames.slice(0, 2)) { // Limit to 2 to avoid rate limits
            try {
              const userResponse = await neynarClient.lookupUserByUsername({
                username: username.replace('@', ''),
              });
              
              if (userResponse.user) {
                neynarDataMap.set(username, {
                  followers: userResponse.user.follower_count,
                  following: userResponse.user.following_count,
                  bio: userResponse.user.profile?.bio?.text,
                });
              }
            } catch (error) {
              console.warn(`Failed to fetch Neynar data for ${username}:`, error);
            }
          }
          
          // Enrich tokens with Neynar data
          enrichedTokens.push(...validTokens.map(token => ({
            ...token,
            neynarData: neynarDataMap.get(token.username),
          })));
        } else {
          enrichedTokens.push(...validTokens);
        }
      } catch (error) {
        console.warn('Failed to fetch Neynar data:', error);
        enrichedTokens.push(...validTokens);
      }
    } else {
      enrichedTokens.push(...validTokens);
    }

    return NextResponse.json(enrichedTokens);
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending tokens' },
      { status: 500 }
    );
  }
} 