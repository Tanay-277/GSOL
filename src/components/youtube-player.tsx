"use client";

import { useEffect, useState } from "react";

interface YouTubePlayerProps {
  videoId: string;
}

export function YouTubePlayer({ videoId }: YouTubePlayerProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Wait for client-side mount to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return a placeholder with the same dimensions during SSR
    return <div className="h-full w-full animate-pulse bg-black/5" />;
  }

  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`}
      className="h-full min-h-[200px] w-full"
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
