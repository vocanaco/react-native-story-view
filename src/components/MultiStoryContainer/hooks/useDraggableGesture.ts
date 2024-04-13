import { StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useKeyboardListener } from '../../../hooks';
import { Colors, Metrics } from '../../../theme';
import styles from '../styles';
import type { DraggableGestureProps } from '../types';

const useDraggableGesture = ({
  backgroundColor,
  onComplete,
  onScrollBeginDrag,
  onScrollEndDrag,
  handleLongPress,
  isSwipeDown,
}: DraggableGestureProps) => {
  const { height, width } = useWindowDimensions();
  const snapPoint: number = Metrics.height / 8;
  const scrollDragPoint: number = Metrics.screenHeight / 6;
  const translateX = useSharedValue<number>(0);
  const translateY = useSharedValue<number>(0);
  const scale = useSharedValue<number>(1);
  const isCompleted = useSharedValue<boolean>(false);
  const isDragged = useSharedValue<boolean | undefined>(undefined);
  const isLongPressed = useSharedValue<boolean | undefined>(false);
  const isKeyboardVisible = useKeyboardListener();

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(Metrics.isIOS ? 150 : 0)
    .onChange(event => {
      isLongPressed.value = true;
      isSwipeDown.value = true;
      if (event.velocityY === 0) return;
      if (event.translationY <= 0) {
        translateY.value = 0;
        return;
      }
      translateX.value = 0;
      translateY.value = event.translationY;

      // When user swipe down to scroll point then set isDragged to true
      if (event.translationY > scrollDragPoint) {
        isDragged.value = true;
      }

      // When user swipe down to snap point then scale the view or reset to 1
      if (event.translationY > snapPoint) {
        scale.value = snapPoint / event.translationY;
      } else {
        scale.value = 1;
      }
    })
    .onEnd(event => {
      isLongPressed.value = false;
      isSwipeDown.value = false;
      isDragged.value = false;
      if (event.translationY > snapPoint) {
        scale.value = withTiming(
          0,
          {
            duration: 300,
          },
          () => {
            isCompleted.value = true;
          }
        );
      } else {
        translateY.value = withTiming(0, {
          duration: 300,
        });
      }
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(200) // To disable the min duration
    .maxDistance(10000) // To disable the max distance
    .onStart(() => {
      isLongPressed.value = true;
    })
    .onEnd(() => {
      isLongPressed.value = false;
    });

  const gestureHandler = Gesture.Simultaneous(longPressGesture, panGesture);

  useAnimatedReaction(
    () => isCompleted.value,
    (value: boolean) => {
      if (value) {
        onComplete && runOnJS(onComplete)();
      }
    }
  );

  const handleScroll = () => {
    if (isDragged.value === undefined) return;
    isDragged.value ? onScrollBeginDrag?.() : onScrollEndDrag?.();
  };

  useAnimatedReaction(
    () => isDragged.value,
    () => {
      if (isKeyboardVisible) return;
      runOnJS(handleScroll)();
    }
  );

  const handleVisibility = () => {
    if (isLongPressed.value === undefined) return;
    // Delaying the long press event to handle visibility of some elements
    // Note: 200ms delay is used to identify long press event
    setTimeout(
      () => {
        handleLongPress?.(isLongPressed.value ?? false);
      },
      isLongPressed.value ? 200 : 0
    );
  };

  useAnimatedReaction(
    () => isLongPressed.value,
    () => {
      if (isKeyboardVisible) return;
      runOnJS(handleVisibility)();
    }
  );

  const listAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      backgroundColor: !isDragged.value
        ? backgroundColor ?? Colors.black
        : Colors.transparent,
    }),
    [backgroundColor, scale, translateX, translateY, isDragged]
  );

  const listStyle = StyleSheet.flatten([styles.list]);
  const rootStyle = { height, width, backgroundColor: Colors.transparent };

  return {
    listStyle,
    rootStyle,
    gestureHandler,
    listAnimatedStyle,
  };
};

export default useDraggableGesture;
