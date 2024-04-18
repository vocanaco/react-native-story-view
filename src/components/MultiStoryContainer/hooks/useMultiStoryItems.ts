import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useAnimatedStyle } from 'react-native-reanimated';
import type { StoryRef } from 'src/components/StoryView';
import { cubeTransition, scaleTransition } from '../utils/StoryTransitions';
import { ScrollValue, TransitionMode } from '../types';
import { Metrics } from '../../../theme';

const useMultiStoryItems = (
  index: number,
  ref: any,
  viewedStories: Array<boolean[]>,
  storyIndex: number,
  storyLength: number,
  isInitialStory?: boolean,
  onComplete?: () => void,
  scrollX?: ScrollValue,
  flatListRef?: any,
  transitionMode?: TransitionMode
) => {
  const storyRef = useRef<StoryRef>(null);
  const [, setIsSeen] = useState<boolean>(false);
  const storyInitialIndex: number = viewedStories?.[index]?.findIndex(
    (val: boolean) => !val
  );

  /**
   * This useEffect is used to render the initial story index after the threshold duration of 700ms.
   * We use this because of some of the initials stories are not forwarding the correct ref to parent.
   */
  useEffect(
    () => {
      if (isInitialStory) {
        setTimeout(() => {
          setIsSeen(true);
        }, 700); // Note: 700ms is the threshold duration to render the initial story index
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useImperativeHandle(ref, () => ({
    onScrollBegin: () => storyRef?.current?.pause(true),
    onScrollEnd: () => storyRef?.current?.pause(false),
    handleLongPress: (visibility: boolean) =>
      storyRef?.current?.handleLongPress(visibility),
  }));

  const width = Metrics.windowWidth;
  const perspective = width;
  const offset = index * width;
  const ratio = Metrics.isIOS ? 2 : 1;
  const inputRange = [offset - width, offset + width];
  const angle = Math.atan(perspective / (width / ratio));

  const animationStyle = useAnimatedStyle(() => {
    if (!scrollX) return {};
    if (scrollX?.value === 0) {
      return {};
    }
    switch (transitionMode) {
      case TransitionMode.Cube:
        return cubeTransition(scrollX, offset, inputRange, angle, width);
      case TransitionMode.Scale:
        return scaleTransition(index, scrollX);
      default:
        return {};
    }
  }, [index, scrollX]);

  const nextStory = () => {
    if (storyIndex + 1 === storyLength) {
      onComplete?.();
      return;
    }
    if (storyIndex >= storyLength - 1) return;
    flatListRef.current?.scrollToIndex({
      index: storyIndex + 1,
      animated: true,
    });
  };

  const previousStory = () => {
    if (storyIndex === 0) return;
    flatListRef.current?.scrollToIndex({
      index: storyIndex - 1,
      animated: true,
    });
  };

  return {
    storyRef,
    nextStory,
    previousStory,
    animationStyle,
    storyInitialIndex,
  };
};

export default useMultiStoryItems;
