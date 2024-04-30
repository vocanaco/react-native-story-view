import { useEffect, useRef, useState } from 'react';
import {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useKeyboardListener } from '../../../hooks';
import type {
  MultiStoryContainerProps,
  PointerType,
  ScrollValue,
  ViewConfig,
  ViewableItemsRef,
} from '../types';
import { Metrics } from '../../../theme';
import useDraggableGesture from './useDraggableGesture';

const useMultiStoryContainer = (
  _flatListRef: any,
  { userStoryIndex, backgroundColor }: Partial<MultiStoryContainerProps>,
  handleLongPress: (visibility: boolean) => void,
  onComplete?: () => void,
  pointers?: PointerType,
  visible?: boolean
) => {
  const [storyIndex, setStoryIndex] = useState(userStoryIndex ?? 0);
  const [isScrollActive, setIsScrollActive] = useState<boolean>(false);
  const isScrollActiveRef = useRef<boolean>(false);
  const viewableItemsRef = useRef<ViewableItemsRef>(null);
  const storyIndexRef = useRef<number>(userStoryIndex ?? 0); // We use the storyIndexRef to keep track of the current story index
  const scrollX: ScrollValue = useSharedValue(0);
  const previousIndex = useRef<number>(0);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
    waitForInteraction: true,
  });
  const isKeyboardVisible = useKeyboardListener();
  const onScroll = useAnimatedScrollHandler(event => {
    scrollX.value = event.contentOffset.x;
  });

  const updateStoryIndex = () => {
    if (viewableItemsRef.current?.index == null) return;
    /* viewableItems returns array of current/next viewable item
           During story transition current/next or previous/current both visible on screen so array contains both items.
           To consider only next/previous item, checking length is only 1 and it is not previous story.
        */
    if (
      viewableItemsRef.current?.length === 1 &&
      viewableItemsRef.current?.index !== previousIndex.current
    ) {
      setStoryIndex(viewableItemsRef.current?.index);
      storyIndexRef.current = viewableItemsRef.current?.index;
      previousIndex.current = viewableItemsRef.current?.index;
    }
  };

  const onViewRef = ({ viewableItems }: ViewConfig) => {
    const index = viewableItems?.[0]?.index;
    viewableItemsRef.current = { index: index, length: viewableItems?.length };

    // If scrolling is active, we will update the story index on scroll end.
    // If scrolling is not active, we will update the story index on view change.
    !isScrollActiveRef.current && updateStoryIndex();
  };

  const layoutValue = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      layoutValue.value = withTiming(1, { duration: 400 }); // Default open Modal animation duration is 400
    }
  }, [layoutValue, visible]);

  const animationModalStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            layoutValue.value,
            [0, 1],
            [-(Metrics.windowHeight / 2 - (pointers?.pageY ?? 0)), 0]
          ),
        },
        {
          translateX: interpolate(
            layoutValue.value,
            [0, 1],
            [-(Metrics.windowWidth / 2 - (pointers?.pageX ?? 0)), 0]
          ),
        },
        { scale: interpolate(layoutValue.value, [0, 1], [0, 1]) },
      ],
    };
  }, [layoutValue, pointers]);

  const { listStyle, rootStyle, gestureHandler, listAnimatedStyle } =
    useDraggableGesture({
      backgroundColor,
      onComplete,
      handleLongPress,
      isKeyboardVisible,
      isScrollActive,
      pointers,
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
    setIsScrollActive,
    updateStoryIndex,
    isScrollActiveRef,
    storyIndexRef,
    animationModalStyle,
  };
};

export default useMultiStoryContainer;
