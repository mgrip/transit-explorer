"use client";

import React, { Fragment, useEffect, useState, useTransition } from "react";
import { TripData, findTripData } from "./actions";
import Link from "next/link";

export default function StopSelect({
  stops,
}: {
  stops: { id: number; name: string }[];
}) {
  const [departureStopId, setDepartureStopId] = useState<number>();
  const [arrivalStopId, setSrrivalStopId] = useState<number>();
  const [displayData, setDisplayData] = useState<TripData>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (departureStopId && arrivalStopId && hasSubmitted) {
      startTransition(async () => {
        const displayData = await findTripData({
          departureStopId,
          arrivalStopId,
        });
        setDisplayData(displayData);
      });
    }
  }, [departureStopId, arrivalStopId, hasSubmitted]);

  stops.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <h1 className="text-3xl text-blue-800 mt-14 flex w-full justify-around">
        Trip Planner
      </h1>
      <div className="w-full mt-4 mb-8 flex justify-around">
        <Link href="/">Back</Link>
      </div>
      <div className="flex w-full justify-around flex-row">
        <select
          data-test="departure-stop-select"
          value={departureStopId}
          onChange={(e) => setDepartureStopId(Number(e.target.value))}
        >
          {stops.map((stop) => {
            return (
              <option key={stop.id} value={stop.id}>
                {stop.name}
              </option>
            );
          })}
        </select>
        <select
          data-test="arrival-stop-select"
          value={arrivalStopId}
          onChange={(e) => setSrrivalStopId(Number(e.target.value))}
        >
          {stops.map((stop) => {
            return (
              <option key={stop.id} value={stop.id}>
                {stop.name}
              </option>
            );
          })}
        </select>
      </div>
      {hasSubmitted ? (
        <div className="flex w-full justify-center">
          {displayData.map((segment, i) => {
            return (
              <Fragment key={i}>
                <div className="m-8">
                  <div style={{ color: `#${segment.route?.color}` }}>
                    {segment.route?.longName}
                  </div>
                  {segment.stops.map((stop) => {
                    return <div key={stop.id}>{stop.name}</div>;
                  })}
                </div>
                {i < displayData.length - 1 && (
                  <div className="self-center flex flex-col w-24 justify-center">
                    Transfer at <b>{segment.stops.at(-1)?.name}</b>
                    <div className="text-xl">👉</div>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col justify-center">
          <button
            data-test="trip-submit"
            disabled={!departureStopId || !arrivalStopId}
            className="m-9 disabled:text-gray-400 text-lg text-green-700"
            onClick={() => setHasSubmitted((previous) => !previous)}
          >
            Go ➡️
          </button>
        </div>
      )}
    </div>
  );
}
