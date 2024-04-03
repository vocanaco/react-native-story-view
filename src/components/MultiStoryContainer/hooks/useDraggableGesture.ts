import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Metrics } from '../../../theme';
import styles from '../styles';
import type { DraggableGestureProps } from '../types';

const useDraggableGesture = ({
  backgroundColor,
  onComplete,
  onScrollBeginDrag,
  onScrollEndDrag,
  handleLongPress,
  isKeyboardVisible,
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
  const isLongPressed = useSharedValue<boolean | undefined>(undefined);

  const gestureHandler = useAnimatedGestureHandler(
    {
      onStart: () => {
        // onStart will call when gesture is started
        // Note: here we set isLongPressed to true because we are using it to handle visibility of some elements
        isLongPressed.value = true;
      },
      onActive: event => {
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
      },
      onCancel: event => {
        isSwipeDown.value = false;
        isDragged.value = false;
        isLongPressed.value = false;
        if (event.translationY > snapPoint) {
          scale.value = 0;
          isCompleted.value = true;
        } else {
          scale.value = 1;
          translateX.value = 0;
          translateY.value = 0;
        }
      },
      onEnd: event => {
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
      },
      onFinish: () => {
        // Finish will call when gesture is completed or released
        isLongPressed.value = false;
      },
    },
    []
  );

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
