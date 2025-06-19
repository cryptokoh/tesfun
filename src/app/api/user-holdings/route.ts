import { NextRequest, NextResponse } from 'next/server';
import { checkUserTokenHoldings, getUserWalletAddress } from '~/lib/tokenBalances';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const userAddress = searchParams.get('address');
    
    // Get user's wallet address
    let walletAddress = userAddress;
    if (!walletAddress && fid) {
      walletAddress = await getUserWalletAddress(parseInt(fid));
    }
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'No wallet address provided' },
        { status: 400 }
      );
    }

    // Get trending tokens from our API
    const trendingResponse = await fetch(`${request.nextUrl.origin}/api/trending-tokens`);
    if (!trendingResponse.ok) {
      throw new Error('Failed to fetch trending tokens');
    }
    
    const trendingTokens = await trendingResponse.json();
    
    // Check user holdings
    const holdings = await checkUserTokenHoldings(walletAddress, trendingTokens);
    
    return NextResponse.json({
      walletAddress,
      ...holdings
    });
  } catch (error) {
    console.error('Error checking user holdings:', error);
    return NextResponse.json(
      { error: 'Failed to check user holdings' },
      { status: 500 }
    );
  }
} 