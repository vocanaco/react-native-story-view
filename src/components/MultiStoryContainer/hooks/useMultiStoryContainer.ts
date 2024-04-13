import { useEffect, useRef, useState } from 'react';
import {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useKeyboardListener } from '../../../hooks';
import type {
  MultiStoryContainerProps,
  ScrollValue,
  SwipeDownValue,
  ViewConfig,
} from '../types';

const useMultiStoryContainer = (
  flatListRef: any,
  { userStoryIndex }: Partial<MultiStoryContainerProps>
) => {
  const [storyIndex, setStoryIndex] = useState(userStoryIndex ?? 0);
  const scrollX: ScrollValue = useSharedValue(0);
  const isSwipeDown: SwipeDownValue = useSharedValue(false);
  const previousIndex = useRef<number>(0);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
  });
  const isKeyboardVisible = useKeyboardListener();
  const onScroll = useAnimatedScrollHandler(event => {
    scrollX.value = event?.contentOffset?.x ?? 0;
  });

  useEffect(() => {
    flatListRef?.current?.setNativeProps({ scrollEnabled: !isKeyboardVisible });
  }, [flatListRef, isKeyboardVisible]);

  const onViewRef = useRef(({ viewableItems }: ViewConfig) => {
    const index = viewableItems?.[0]?.index;
    if (index == null) return;
    /* viewableItems returns array of current/next viewable item
           During story transition current/next or previous/current both visible on screen so array contains both items.
           To consider only next/previous item, checking length is only 1 and it is not previous story.  
        */
    if (viewableItems.length === 1 && index !== previousIndex.current) {
      setStoryIndex(index);
      previousIndex.current = index;
    }
  });

  const onStopSCroll = (value: boolean) =>
    flatListRef?.current?.setNativeProps({
      scrollEnabled: !value,
    });

  useAnimatedReaction(
    () => isSwipeDown?.value,
    (value: boolean) => {
      runOnJS(onStopSCroll)(value);
    }
  );

  return {
    scrollX,
    onViewRef,
    viewabilityConfig,
    storyIndex,
    setStoryIndex,
    onScroll,
  };
};

export default useMultiStoryContainer;
