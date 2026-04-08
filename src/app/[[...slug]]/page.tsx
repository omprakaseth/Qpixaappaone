"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import the App component to avoid SSR issues with react-router-dom
const App = dynamic(() => import("@/App"), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
});

export default function CatchAllPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('CatchAllPage: Mounted');
    setMounted(true);
  }, []);

  if (!mounted) {
    console.log('CatchAllPage: Not mounted yet');
    return null;
  }

  console.log('CatchAllPage: Rendering App');
  return <App />;
}
