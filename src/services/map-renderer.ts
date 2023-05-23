import { Coords } from "@/common/types";
import { RefObject } from "react";
import { MapGameMode } from "./map-service";

function getTextBBox(ctx: CanvasRenderingContext2D, text: string) {
  const metrics = ctx.measureText(text);
  const left = metrics.actualBoundingBoxLeft * -1;
  const top = metrics.actualBoundingBoxAscent * -1;
  const right = metrics.actualBoundingBoxRight;
  const bottom = metrics.actualBoundingBoxDescent;
  // actualBoundinBox... excludes white spaces
  const width = text.trim() === text ? right - left : metrics.width;
  const height = bottom - top;
  return { left, top, right, bottom, width, height };
}

function liangBarsky(
  width: number,
  height: number,
  start: Coords,
  end: Coords
): Coords {
  let t0 = 0;
  let t1 = 1;
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const p = [-dx, dx, -dy, dy];
  const q = [start.x, width - start.x, start.y, height - start.y];

  for (let i = 0; i < 4; i++) {
    const pVal = p[i],
      qVal = q[i];
    if (pVal === 0 && qVal < 0) return end;
    if (pVal < 0) t0 = Math.max(t0, qVal / pVal);
    if (pVal > 0) t1 = Math.min(t1, qVal / pVal);
    if (t0 > t1) return end;
  }

  const intersect = {
    x: start.x + t1 * dx,
    y: start.y + t1 * dy,
  };

  return intersect;
}

/**
 * Draws a text string on a canvas context with a semi-transparent background.
 * The text is placed along the 'start' to 'end' line, keeping the text
 * box from occluding the 'end' point by offsetting it towards the
 * direction of the line.
 *
 * If the 'end' point is outside the canvas, the text is placed near the
 * intersection of the line with the canvas edge, using the Liang-Barsky
 * algorithm, and ensuring the text box is fully visible and padded from
 * the intersection.
 */
function drawTextAheadOfEnd(
  ctx: CanvasRenderingContext2D,
  start: Coords,
  end: Coords,
  text: string
) {
  const metrics = getTextBBox(ctx, text);
  const edgePadding = 30; // The distance from 'end' to the nearest edge of the textbox
  const textPadding = 5; // padding around the text inside the box

  // Calculate the direction of the line from start to end
  const dirX = end.x - start.x;
  const dirY = end.y - start.y;

  // Normalize the direction
  const len = Math.sqrt(dirX * dirX + dirY * dirY);
  const dirNormX = dirX / len;
  const dirNormY = dirY / len;

  let offsetX, offsetY;

  // Check if 'end' point is outside the canvas
  if (
    end.x < 0 ||
    end.y < 0 ||
    end.x > ctx.canvas.width ||
    end.y > ctx.canvas.height
  ) {
    // If 'end' point is outside, find intersection point using Liang-Barsky algorithm
    const intersection = liangBarsky(
      ctx.canvas.width,
      ctx.canvas.height,
      start,
      end
    );
    offsetX = intersection.x + dirNormX * (metrics.width / 2 + edgePadding);
    offsetY = intersection.y + dirNormY * (metrics.height / 2 + edgePadding);
  } else {
    // If 'end' point is inside, calculate the offset as usual
    offsetX = end.x + dirNormX * (metrics.width / 2 + edgePadding);
    offsetY = end.y + dirNormY * (metrics.height / 2 + edgePadding);
  }

  // Clamp the position within the canvas, taking into account the edgePadding
  const posX = Math.max(
    Math.min(offsetX, ctx.canvas.width - metrics.width / 2 - edgePadding),
    metrics.width / 2 + edgePadding
  );
  const posY = Math.max(
    Math.min(offsetY, ctx.canvas.height - metrics.height / 2 - edgePadding),
    metrics.height / 2 + edgePadding
  );

  // Draw the background rectangle with textPadding
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(
    posX - metrics.width / 2 - textPadding,
    posY - metrics.height / 2 - textPadding,
    metrics.width + 2 * textPadding,
    metrics.height + 2 * textPadding
  );

  // Draw the text
  ctx.fillStyle = "white";
  ctx.fillText(text, posX, posY);
}

/**
 * Draws a text string on a canvas context with a semi-transparent background.
 * The text is placed to the right of the 'end' point along the line from 'start' to 'end'.
 *
 * If the 'end' point is outside the canvas, the text is placed near the
 * intersection of the line with the canvas edge, using the Liang-Barsky
 * algorithm, and ensuring the text box is fully visible and padded from
 * the intersection.
 */
function drawTextRightOfEnd(
  ctx: CanvasRenderingContext2D,
  start: Coords,
  end: Coords,
  text: string
) {
  /**
   * Draws a text string on a canvas context with a semi-transparent background.
   * The text is placed along the 'start' to 'end' line, keeping the text
   * box from occluding the 'end' point by offsetting it 90 degrees perpendicular
   * from the end of the 'start' to 'end' line.
   *
   * If the 'end' point is outside the canvas, the text is placed near the
   * intersection of the line with the canvas edge, using the Liang-Barsky
   * algorithm, and ensuring the text box is fully visible and padded from
   * the intersection.
   */
  const metrics = getTextBBox(ctx, text);
  const edgePadding = 20;
  const textPadding = 5;

  const dirX = end.x - start.x;
  const dirY = end.y - start.y;

  // Normalize the direction
  const len = Math.sqrt(dirX * dirX + dirY * dirY);
  const dirNormX = dirX / len;
  const dirNormY = dirY / len;

  // Calculate the perpendicular direction for offset
  const perpDirX = -dirNormY;
  const perpDirY = dirNormX;

  let offsetX, offsetY;

  if (
    end.x < 0 ||
    end.y < 0 ||
    end.x > ctx.canvas.width ||
    end.y > ctx.canvas.height
  ) {
    const intersection = liangBarsky(
      ctx.canvas.width,
      ctx.canvas.height,
      start,
      end
    );
    offsetX = intersection.x + perpDirX * (metrics.width / 2 + edgePadding);
    offsetY = intersection.y + perpDirY * (metrics.height / 2 + edgePadding);
  } else {
    offsetX = end.x + perpDirX * (metrics.width / 2 + edgePadding);
    offsetY = end.y + perpDirY * (metrics.height / 2 + edgePadding);
  }

  const posX = Math.max(
    Math.min(offsetX, ctx.canvas.width - metrics.width / 2 - edgePadding),
    metrics.width / 2 + edgePadding
  );
  const posY = Math.max(
    Math.min(offsetY, ctx.canvas.height - metrics.height / 2 - edgePadding),
    metrics.height / 2 + edgePadding
  );

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(
    posX - metrics.width / 2 - textPadding,
    posY - metrics.height / 2 - textPadding,
    metrics.width + 2 * textPadding,
    metrics.height + 2 * textPadding
  );

  ctx.fillStyle = "white";
  ctx.fillText(text, posX, posY);

  // const metrics = getTextBBox(ctx, text);
  // const edgePadding = 20;
  // const textPadding = 5;

  // // Offset the X position by the width of the text box plus edgePadding
  // let offsetX = end.x + metrics.width / 2 + edgePadding;

  // // Y position remains the same
  // let offsetY = end.y;

  // if (
  //   end.x < 0 ||
  //   end.y < 0 ||
  //   end.x > ctx.canvas.width ||
  //   end.y > ctx.canvas.height
  // ) {
  //   const intersection = liangBarsky(
  //     ctx.canvas.width,
  //     ctx.canvas.height,
  //     start,
  //     end
  //   );
  //   offsetX = intersection.x + metrics.width / 2 + edgePadding;
  //   offsetY = intersection.y;
  // }

  // const posX = Math.max(
  //   Math.min(offsetX, ctx.canvas.width - metrics.width / 2 - edgePadding),
  //   metrics.width / 2 + edgePadding
  // );
  // const posY = Math.max(
  //   Math.min(offsetY, ctx.canvas.height - metrics.height / 2 - edgePadding),
  //   metrics.height / 2 + edgePadding
  // );

  // ctx.fillStyle = "rgba(0,0,0,0.5)";
  // ctx.fillRect(
  //   posX - metrics.width / 2 - textPadding,
  //   posY - metrics.height / 2 - textPadding,
  //   metrics.width + 2 * textPadding,
  //   metrics.height + 2 * textPadding
  // );

  // ctx.fillStyle = "white";
  // ctx.fillText(text, posX, posY);
}

function drawLineFromStartToEnd(
  ctx: CanvasRenderingContext2D,
  start: Coords,
  end: Coords
) {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}

const triangleSize = 10; // Size of the triangle

function drawStartTriangle(
  ctx: CanvasRenderingContext2D,
  start: Coords,
  end: Coords
) {
  // Calculate the angle between the line segment and the positive x-axis
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  // Calculate the coordinates for the triangle points
  const tipX = start.x + (triangleSize / 2) * Math.cos(angle);
  const tipY = start.y + (triangleSize / 2) * Math.sin(angle);
  const baseX = tipX + triangleSize * Math.cos(angle + (Math.PI * 5) / 6);
  const baseY = tipY + triangleSize * Math.sin(angle + (Math.PI * 5) / 6);
  const sideX = tipX + triangleSize * Math.cos(angle - (Math.PI * 5) / 6);
  const sideY = tipY + triangleSize * Math.sin(angle - (Math.PI * 5) / 6);

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(baseX, baseY);
  ctx.lineTo(sideX, sideY);
  ctx.closePath();

  ctx.fillStyle = "yellow";
  ctx.fill();
}

const targetCircleRadius = 3;

function drawEndCircle(ctx: CanvasRenderingContext2D, end: Coords) {
  ctx.beginPath();
  ctx.ellipse(end.x, end.y, targetCircleRadius, targetCircleRadius, 0, 0, 360);
  ctx.closePath();
  ctx.fillStyle = "red";
  ctx.fill();
}

export const createCanvasMapRenderer = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  startCoords: RefObject<Coords | null>,
  endCoords: RefObject<Coords | null>,
  mouseCoords: RefObject<Coords>,
  isUsingTouch: RefObject<boolean>,
  gameMode: MapGameMode
) => {
  if (!canvasRef.current) return null;

  const ctx = canvasRef.current.getContext("2d");
  if (!ctx) return null;

  ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
  ctx.shadowBlur = 5;

  ctx.font = "24px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  function render() {
    if (!canvasRef.current || !ctx) return;

    if (!startCoords.current) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const start = startCoords.current;
    const end = endCoords.current ?? mouseCoords.current;

    if (!start || !end) {
      return;
    }

    const pixelDistance = Math.hypot(end.x - start.x, end.y - start.y);
    if (pixelDistance <= 5) {
      return;
    }

    // User's finished dragging, do the math
    drawLineFromStartToEnd(ctx, start, end);
    drawStartTriangle(ctx, start, end);
    drawEndCircle(ctx, end);

    const meterDistance =
      (gameMode.gridMeters / gameMode.gridPixelSize) * pixelDistance;

    const distanceText = `${Math.round(meterDistance)}m`;

    if (isUsingTouch.current) {
      drawTextAheadOfEnd(ctx, start, end, distanceText);
    } else {
      drawTextRightOfEnd(ctx, start, end, distanceText);
    }
  }

  let disposed = false;
  let animationFrameHandle: number | null = null;

  function renderLoop() {
    if (disposed) return;
    render();
    animationFrameHandle = requestAnimationFrame(renderLoop);
  }

  function start() {
    animationFrameHandle = requestAnimationFrame(renderLoop);

    return function disposeRenderer() {
      disposed = true;
      if (animationFrameHandle !== null) {
        cancelAnimationFrame(animationFrameHandle);
        animationFrameHandle = null;
      }
    };
  }

  return {
    start,
  };
};
