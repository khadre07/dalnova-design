"use client";

import { Suspense, lazy } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function SplineScene({ scene, className, onLoad, onError }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <span className="loader" />
        </div>
      }
    >
      <Spline scene={scene} className={className} onLoad={onLoad} onError={onError} />
    </Suspense>
  );
}
