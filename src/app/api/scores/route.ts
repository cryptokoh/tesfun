import { NextRequest, NextResponse } from 'next/server';
import { Redis } from "@upstash/redis";
import { APP_NAME } from "../../../lib/constants";

// Use Redis if KV env vars are present, otherwise use in-memory
const useRedis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
const redis = useRedis ? new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
}) : null;

// In-memory fallback storage
const localStore = new Map<string, any>();

interface GameScore {
  fid: number;
  username: string;
  score: number;
  fludEarned: number;
  timestamp: number;
  avatar?: string;
}

function getScoresKey(): string {
  return `${APP_NAME}:scores`;
}

function getUserScoreKey(fid: number): string {
  return `${APP_NAME}:user_score:${fid}`;
}

// GET - Retrieve leaderboard
export async function GET() {
  try {
    const scoresKey = getScoresKey();
    let scores: GameScore[] = [];

    if (redis) {
      scores = await redis.get<GameScore[]>(scoresKey) || [];
    } else {
      scores = Array.from(localStore.values())
        .filter(item => item.type === 'score')
        .map(item => item.data);
    }

    // Sort by score descending and take top 10
    const leaderboard = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((score, index) => ({
        rank: index + 1,
        username: score.username,
        score: score.score,
        fludEarned: score.fludEarned,
        avatar: score.avatar
      }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

// POST - Store a new score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, username, score, fludEarned, avatar } = body;

    if (!fid || !username || score === undefined || fludEarned === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const gameScore: GameScore = {
      fid,
      username,
      score,
      fludEarned,
      timestamp: Date.now(),
      avatar
    };

    const scoresKey = getScoresKey();
    const userScoreKey = getUserScoreKey(fid);

    if (redis) {
      // Get existing scores
      const existingScores = await redis.get<GameScore[]>(scoresKey) || [];
      
      // Remove old score for this user if exists
      const filteredScores = existingScores.filter(s => s.fid !== fid);
      
      // Add new score
      const updatedScores = [...filteredScores, gameScore];
      
      // Store updated scores
      await redis.set(scoresKey, updatedScores);
      await redis.set(userScoreKey, gameScore);
    } else {
      // Store in local memory
      localStore.set(userScoreKey, { type: 'score', data: gameScore });
      
      // Update leaderboard in memory
      const existingScores = Array.from(localStore.values())
        .filter(item => item.type === 'score')
        .map(item => item.data);
      
      const filteredScores = existingScores.filter(s => s.fid !== fid);
      const updatedScores = [...filteredScores, gameScore];
      
      // Store each score individually
      updatedScores.forEach(score => {
        localStore.set(getUserScoreKey(score.fid), { type: 'score', data: score });
      });
    }

    return NextResponse.json({ success: true, score: gameScore });
  } catch (error) {
    console.error('Error storing score:', error);
    return NextResponse.json({ error: 'Failed to store score' }, { status: 500 });
  }
} 