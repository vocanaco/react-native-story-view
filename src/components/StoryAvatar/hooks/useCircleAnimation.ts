import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { CircleAnimationProps } from '../types';
import { useEffect } from 'react';

const useCircleAnimation = ({
  pressedIndex,
  index,
  isStoryViewVisible,
}: CircleAnimationProps) => {
  const offset = useSharedValue<number>(1);

  useEffect(() => {
    if (isStoryViewVisible && pressedIndex === index) {
      offset.value = withTiming(
        // Note: use of 1.0001, because of run animation on every time.
        // if we use 1 then it will not run animation because of initial value is 1.
        // If we set 1 It will directly call finished callback.
        1.0001,
        {
          duration: 400,
          easing: Easing.circle,
        },
        finished => {
          if (finished) {
            offset.value = 0;
          }
        }
      );
    } else {
      offset.value = withTiming(1, {
        duration: 200,
        easing: Easing.circle,
      });
    }
  }, [index, isStoryViewVisible, offset, pressedIndex]);

  const avatarAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(offset.value, [0, 1], [0, 1]),
        },
      ],
    };
  }, [offset]);

  return { avatarAnimatedStyle };
};

export default useCircleAnimation;
