"use client";

import React, { useEffect, useRef } from "react";

// copied from https://stackoverflow.com/questions/44398889/drawing-latitude-longitude-of-array-elements-on-canvas
function getBoundingRect(data: { latitude: number; longitude: number }[]) {
  let left = Infinity,
    right = -Infinity;
  let top = Infinity,
    bottom = -Infinity;

  for (const { latitude, longitude } of data) {
    if (left > latitude) left = latitude;
    if (top > longitude) top = longitude;
    if (right < latitude) right = latitude;
    if (bottom < longitude) bottom = longitude;
  }
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function draw(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  data: MapProps["routePatterns"]
) {
  const allStops = data.reduce<{ latitude: number; longitude: number }[]>(
    (acc, routePattern) => {
      return [
        ...acc,
        ...routePattern.routePatternStops.map((routePatternStop) => ({
          latitude: routePatternStop.stop.latitude,
          longitude: routePatternStop.stop.longitude,
        })),
      ];
    },
    []
  );
  const boundingRect = getBoundingRect(allStops);
  const scale = Math.min(canvas.width, canvas.height);
  data.forEach((routePattern) => {
    ctx.beginPath();
    routePattern.routePatternStops.sort((a, b) => (a.index < b.index ? -1 : 1));
    const firstStop = routePattern.routePatternStops[0];
    const firstX =
      ((firstStop.stop.latitude - boundingRect.x) / boundingRect.width) * scale;
    const firstY =
      ((firstStop.stop.longitude - boundingRect.y) / boundingRect.height) *
      scale;
    ctx.moveTo(firstX, firstY);
    ctx.strokeStyle = `#${routePattern.route.color}` ?? "black";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";

    routePattern.routePatternStops.forEach((routePatternStop) => {
      const x =
        ((routePatternStop.stop.latitude - boundingRect.x) /
          boundingRect.width) *
        scale;
      const y =
        ((routePatternStop.stop.longitude - boundingRect.y) /
          boundingRect.height) *
        scale;
      ctx.lineTo(x - 3, y - 3);
      ctx.strokeRect(x - 5, y - 5, 10, 10);
      ctx.stroke();
    });
  });
}

interface MapProps {
  routePatterns: {
    name: string;
    route: { longName: string; color: string | null };
    routePatternStops: {
      stop: { id: number; latitude: number; longitude: number };
      index: number;
    }[];
  }[];
}

export default function Map({ routePatterns }: MapProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      const ctx = ref.current.getContext("2d");

      ref.current.width = window.innerWidth;
      ref.current.height = window.innerHeight;

      if (ctx) {
        draw(ref.current, ctx, routePatterns);
      }
    }
  });

  return (
    <canvas
      ref={ref}
      className="-rotate-90 p-28 -mt-32 overflow-visible -z-10"
    />
  );
}
