"use client";

import dynamic from "next/dynamic";

// Dynamic import with ssr: false in a client component
const ShibaGame = dynamic(() => import("./ShibaGame"), {
  ssr: false,
});

export default function ClientShibaGame() {
  return <ShibaGame />;
} 