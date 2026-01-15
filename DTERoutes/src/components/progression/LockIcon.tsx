/**
 * LockIcon
 * ========
 * Lock icon for locked routes
 */

import React from 'react';
import Svg, {Path, Rect} from 'react-native-svg';
import {Colors} from '../../theme';

interface LockIconProps {
  size?: number;
  color?: string;
}

export function LockIcon({
  size = 24,
  color = Colors.primaryAccent,
}: LockIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Lock body */}
      <Rect
        x={4}
        y={11}
        width={16}
        height={11}
        rx={2}
        fill={color}
      />

      {/* Lock shackle */}
      <Path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Keyhole */}
      <Path
        d="M12 15a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
        fill="#000"
        opacity={0.3}
      />
    </Svg>
  );
}

export default LockIcon;
