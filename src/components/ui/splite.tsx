"use client";

import { Suspense, lazy } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

/* `unknown` rather than the runtime's Application type: importing that type
   pulls the runtime into the module graph eagerly, which is the one thing the
   lazy import above exists to avoid. The caller narrows it. */
interface SplineSceneProps {
  scene: string;
  className?: string;
  onLoad?: (app: unknown) => void;
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
