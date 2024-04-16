import { useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { useKeyboardListener } from '../../../hooks';
import type {
  MultiStoryContainerProps,
  ScrollValue,
  ViewConfig,
} from '../types';
import useDraggableGesture from './useDraggableGesture';

const useMultiStoryContainer = (
  _flatListRef: any,
  { userStoryIndex, backgroundColor }: Partial<MultiStoryContainerProps>,
  onScrollBeginDrag: () => void,
  onScrollEndDrag: () => void,
  handleLongPress: (visibility: boolean) => void,
  onComplete?: () => void
) => {
  const [storyIndex, setStoryIndex] = useState(userStoryIndex ?? 0);
  const scrollX: ScrollValue = useSharedValue(0);
  const previousIndex = useRef<number>(0);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
  });
  const isKeyboardVisible = useKeyboardListener();
  const onScroll = (event: any) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
  };

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

  const { listStyle, rootStyle, gestureHandler, listAnimatedStyle } =
    useDraggableGesture({
      backgroundColor,
      onComplete,
      onScrollBeginDrag,
      onScrollEndDrag,
      handleLongPress,
      isKeyboardVisible,
    });

  return {
    scrollX,
    onViewRef,
    viewabilityConfig,
    listStyle,
    rootStyle,
    storyIndex,
    gestureHandler,
    setStoryIndex,
    onScroll,
    listAnimatedStyle,
    isKeyboardVisible,
  };
};

export default useMultiStoryContainer;
