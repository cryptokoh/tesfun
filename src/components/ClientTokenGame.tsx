"use client";

import dynamic from "next/dynamic";

// Dynamic import with ssr: false in a client component
const TokenGame = dynamic(() => import("./TokenGame"), {
  ssr: false,
});

export default function ClientTokenGame() {
  return <TokenGame />;
} 