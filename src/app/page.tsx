import { Metadata } from "next";
import dynamic from "next/dynamic";
import { APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE_URL } from "~/lib/constants";
import { getMiniAppEmbedMetadata } from "~/lib/utils";

// note: dynamic import is required for components that use the Frame SDK
const TokenGame = dynamic(() => import("~/components/TokenGame"), {
  ssr: false,
});

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: APP_NAME,
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [APP_OG_IMAGE_URL],
    },
    other: {
      "fc:frame": JSON.stringify(getMiniAppEmbedMetadata()),
    },
  };
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <TokenGame />
      </div>
    </main>
  );
}
