"use client";

import dynamic from "next/dynamic";

// Dynamic import with ssr: false in a client component
const ShibaGame = dynamic(() => import("./ShibaGame"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
          <div className="text-2xl">🌊</div>
        </div>
        <p className="text-gray-600">Loading River Adventure...</p>
      </div>
    </div>
  ),
});

export default function ClientShibaGame() {
  return <ShibaGame />;
} 