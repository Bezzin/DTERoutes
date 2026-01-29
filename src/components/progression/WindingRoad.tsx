/**
 * WindingRoad
 * ===========
 * SVG road path with smooth Bezier curves connecting route nodes
 */

import React, {useMemo} from 'react';
import {StyleSheet, Dimensions} from 'react-native';
import Svg, {Path} from 'react-native-svg';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// Node position type
export interface NodePosition {
  x: number;
  y: number;
}

// Road configuration
const ROAD_WIDTH = 50;
const NODE_SPACING_Y = 150; // Vertical spacing between nodes
const PADDING_TOP = 100;
const PADDING_BOTTOM = 120;

interface WindingRoadProps {
  nodeCount: number;
  height: number;
}

/**
 * Calculate positions for route nodes in a winding S-curve pattern
 */
export function calculateNodePositions(
  nodeCount: number,
  screenWidth: number = SCREEN_WIDTH,
): NodePosition[] {
  const positions: NodePosition[] = [];
  const leftX = screenWidth * 0.25;
  const rightX = screenWidth * 0.75;

  for (let i = 0; i < nodeCount; i++) {
    // Alternate between left and right
    const x = i % 2 === 0 ? leftX : rightX;
    // Y position from bottom to top (index 0 at bottom)
    const y = PADDING_BOTTOM + i * NODE_SPACING_Y;
    positions.push({x, y});
  }

  return positions;
}

/**
 * Calculate total content height based on node count
 */
export function calculateContentHeight(nodeCount: number): number {
  return PADDING_TOP + PADDING_BOTTOM + (nodeCount - 1) * NODE_SPACING_Y + 80;
}

/**
 * Generate SVG path string for road using quadratic Bezier curves
 */
function generateRoadPath(positions: NodePosition[]): string {
  if (positions.length < 2) return '';

  let path = `M ${positions[0].x} ${positions[0].y}`;

  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];

    // Control point for smooth curve (midpoint vertically, with horizontal offset)
    const midY = (prev.y + curr.y) / 2;

    // Create S-curve with two quadratic bezier curves
    // First curve from prev to midpoint
    path += ` Q ${prev.x} ${midY} ${(prev.x + curr.x) / 2} ${midY}`;
    // Second curve from midpoint to curr
    path += ` Q ${curr.x} ${midY} ${curr.x} ${curr.y}`;
  }

  return path;
}

export function WindingRoad({nodeCount, height}: WindingRoadProps) {
  const positions = useMemo(
    () => calculateNodePositions(nodeCount),
    [nodeCount],
  );

  const roadPath = useMemo(() => generateRoadPath(positions), [positions]);

  if (positions.length < 2) return null;

  return (
    <Svg
      width={SCREEN_WIDTH}
      height={height}
      style={StyleSheet.absoluteFill}>
      {/* Road shadow/edge */}
      <Path
        d={roadPath}
        stroke="#1A1A1A"
        strokeWidth={ROAD_WIDTH + 8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Road surface */}
      <Path
        d={roadPath}
        stroke="#333333"
        strokeWidth={ROAD_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Center dashed line */}
      <Path
        d={roadPath}
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeDasharray="12 8"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

// Export constants for use by other components
export {NODE_SPACING_Y, PADDING_TOP, PADDING_BOTTOM};

export default WindingRoad;
