import { Coords } from "@/common/types";
import { createCanvasMapRenderer } from "@/services/map-renderer";
import { MapGameMode } from "@/services/map-service";
import styles from "@/styles/Map.module.css";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef } from "react";

interface MapProps {
  mapName: string;
  gameMode: MapGameMode;
}

const useClearCanvasOnRerender = (
  canvasRef: React.RefObject<HTMLCanvasElement>
) => {
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    canvasRef.current
      .getContext("2d")
      ?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });
};

const useMouseDragging = (dragTargetRef: React.RefObject<HTMLElement>) => {
  const isDragging = useRef<boolean>(false);
  const startCoords = useRef<Coords | null>(null);
  const endCoords = useRef<Coords | null>(null);
  const mouseCoords = useRef<Coords>({ x: 0, y: 0 });

  useEffect(() => {
    // reset state on rerender
    isDragging.current = false;
    startCoords.current = null;
    endCoords.current = null;
  });

  const onDrawStart = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!dragTargetRef.current) return;
      isDragging.current = true;
      const canvasPos = dragTargetRef.current.getBoundingClientRect();

      const x = e.clientX - canvasPos.left;
      const y = e.clientY - canvasPos.top;
      if (startCoords.current) {
        startCoords.current.x = x;
        startCoords.current.y = y;
      } else {
        startCoords.current = { x, y };
      }

      if (endCoords.current) {
        endCoords.current = null;
      }
    },
    [dragTargetRef]
  );

  const onParentMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!dragTargetRef.current) return;
      const canvasPos = dragTargetRef.current.getBoundingClientRect();
      mouseCoords.current.x = e.clientX - canvasPos.left;
      mouseCoords.current.y = e.clientY - canvasPos.top;
    },
    [dragTargetRef]
  );

  useEffect(() => {
    function onDrawEnd(e: MouseEvent) {
      if (!dragTargetRef.current) return;
      if (!isDragging.current) {
        startCoords.current = null;
        return;
      }
      isDragging.current = false;
      const canvasPos = dragTargetRef.current.getBoundingClientRect();

      const x = e.clientX - canvasPos.left;
      const y = e.clientY - canvasPos.top;
      if (endCoords.current) {
        endCoords.current.x = x;
        endCoords.current.y = y;
      } else {
        endCoords.current = { x, y };
      }
    }

    document.addEventListener("mouseup", onDrawEnd, { passive: true });
    return () => document.removeEventListener("mouseup", onDrawEnd);
  }, [dragTargetRef]);

  return useMemo(
    () => ({
      startCoords,
      endCoords,
      mouseCoords,

      dragTargetProps: {
        onMouseDown: onDrawStart,
      },

      dragParentProps: {
        onMouseMove: onParentMouseMove,
      },
    }),
    [startCoords, endCoords, mouseCoords, onDrawStart, onParentMouseMove]
  );
};

export const Map = ({ mapName, gameMode }: MapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    startCoords,
    endCoords,
    mouseCoords,

    dragParentProps,
    dragTargetProps,
  } = useMouseDragging(canvasRef);

  useClearCanvasOnRerender(canvasRef);

  useEffect(() => {
    const renderer = createCanvasMapRenderer(
      canvasRef,
      startCoords,
      endCoords,
      mouseCoords,
      gameMode
    );
    if (!renderer) return;

    return renderer.start();
  });

  return (
    <div className={styles.container} {...dragParentProps}>
      <div>
        Grid square: {gameMode.gridMeters}, pixels per meter:{" "}
        {gameMode.gridPixelSize}
      </div>
      <div>{gameMode.mapGameModeKey}</div>

      <div className={styles.imageContainer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* <img
          src={`/maps/${encodeURIComponent(gameMode.mapGameModeKey)}.png`}
          className={styles.mapImage}
          alt={`[${gameMode.gameMode}] ${mapName}`}
          width={532}
          height={532}
        /> */}
        <Image
          src={`/maps/${encodeURIComponent(gameMode.mapGameModeKey)}.png`}
          className={styles.mapImage}
          alt={`[${gameMode.gameMode}] ${mapName}`}
          width={532}
          height={532}
          quality={100}
          unoptimized
          priority
        />
        <canvas
          className={styles.mapCanvas}
          width={532}
          height={532}
          ref={canvasRef}
          {...dragTargetProps}
        />
      </div>
    </div>
  );
};
