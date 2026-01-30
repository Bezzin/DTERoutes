/**
 * CarAvatar
 * =========
 * Orange car icon that sits on the active route node
 */

import React from 'react';
import Svg, {Path, Circle, Defs, LinearGradient, Stop} from 'react-native-svg';
import {Colors} from '../../theme';

interface CarAvatarProps {
  size?: number;
}

export function CarAvatar({size = 36}: CarAvatarProps) {
  const scale = size / 40;

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Defs>
        <LinearGradient id="carGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={Colors.primaryAccentLight} />
          <Stop offset="100%" stopColor={Colors.primaryAccentDark} />
        </LinearGradient>
      </Defs>

      {/* Car body */}
      <Path
        d="M8 26 L8 18 L12 12 L28 12 L32 18 L32 26 L8 26"
        fill="url(#carGradient)"
        stroke={Colors.text}
        strokeWidth={1.5}
      />

      {/* Windshield */}
      <Path
        d="M12 18 L14 14 L26 14 L28 18"
        fill={Colors.backgroundSecondary}
        stroke={Colors.text}
        strokeWidth={1}
      />

      {/* Front lights */}
      <Circle cx={10} cy={22} r={2} fill="#FFC107" />
      <Circle cx={30} cy={22} r={2} fill="#FFC107" />

      {/* Wheels */}
      <Circle cx={14} cy={26} r={4} fill={Colors.backgroundTertiary} stroke={Colors.text} strokeWidth={1} />
      <Circle cx={26} cy={26} r={4} fill={Colors.backgroundTertiary} stroke={Colors.text} strokeWidth={1} />

      {/* Wheel centers */}
      <Circle cx={14} cy={26} r={1.5} fill="#666" />
      <Circle cx={26} cy={26} r={1.5} fill="#666" />
    </Svg>
  );
}

export default CarAvatar;
