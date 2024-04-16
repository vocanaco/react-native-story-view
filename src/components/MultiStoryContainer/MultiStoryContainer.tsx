import { FlashList } from '@shopify/flash-list';
import React, {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Modal, View } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Metrics } from '../../theme';
import { Footer } from '../Footer';
import { Indicator, ProfileHeader, StoryContainer } from '../StoryView';
import type { StoryRef } from '../StoryView/types';
import { useMultiStoryContainer } from './hooks';
import styles from './styles';
import {
  ListItemProps,
  ListItemRef,
  MultiStoryContainerProps,
  MultiStoryListItemProps,
  TransitionMode,
} from './types';
import {
  cubeTransition,
  defaultTransition,
  scaleTransition,
} from './utils/StoryTransitions';

const MultiStoryListItem = forwardRef<ListItemRef, MultiStoryListItemProps>(
  (
    {
      item,
      index,
      scrollX,
      storyIndex,
      onComplete,
      viewedStories,
      isTransitionActive,
      flatListRef,
      storyLength,
      ...props
    }: MultiStoryListItemProps,
    ref
  ) => {
    const storyRef = useRef<StoryRef>(null);
    const storyInitialIndex: number = viewedStories?.[index]?.findIndex(
      (val: boolean) => !val
    );

    useImperativeHandle(ref, () => ({
      onScrollBegin: () => storyRef?.current?.pause(true),
      onScrollEnd: () => storyRef?.current?.pause(false),
      handleLongPress: (visibility: boolean) =>
        storyRef?.current?.handleLongPress(visibility),
    }));

    const animationStyle = useAnimatedStyle(() => {
      if (scrollX.value === 0) {
        return defaultTransition();
      }
      switch (props.transitionMode) {
        case TransitionMode.Cube:
          return cubeTransition(index, scrollX);
        case TransitionMode.Scale:
          return scaleTransition(index, scrollX);
        default:
          return defaultTransition();
      }
    }, [index, scrollX.value]);

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

    return (
      <View key={item.id} style={styles.itemContainer}>
        {storyIndex === index || isTransitionActive ? (
          <Animated.View style={animationStyle}>
            <StoryContainer
              visible={true}
              extended={false}
              key={index + item?.id}
              ref={storyRef}
              userStories={item}
              nextStory={nextStory}
              previousStory={previousStory}
              stories={item.stories}
              progressIndex={storyInitialIndex < 0 ? 0 : storyInitialIndex}
              maxVideoDuration={15}
              renderHeaderComponent={() => (
                <ProfileHeader
                  userImage={{ uri: item.profile ?? '' }}
                  userName={item.username}
                  userMessage={item.title}
                  onClosePress={() => {
                    onComplete?.();
                  }}
                />
              )}
              renderFooterComponent={() => <Footer />}
              {...props}
              index={index}
              userStoryIndex={storyIndex}
            />
          </Animated.View>
        ) : (
          props?.renderIndicatorComponent?.() ?? <Indicator />
        )}
      </View>
    );
  }
);

const MultiStoryContainer = ({
  stories,
  visible,
  onComplete,
  onUserStoryIndexChange,
  viewedStories = [],
  ...props
}: MultiStoryContainerProps) => {
  const flatListRef = useRef<any>(null);
  const itemsRef = useRef<ListItemRef[]>([]);
  const [isTransitionActive, setIsTransitionActive] = useState<boolean>(false);

  useEffect(() => {
    itemsRef.current = itemsRef.current.slice(0, stories.length);
  }, [itemsRef, stories]);

  const onScrollBeginDrag = () => itemsRef.current[storyIndex]?.onScrollBegin();
  const onScrollEndDrag = () => itemsRef.current[storyIndex]?.onScrollEnd();
  const handleLongPress = (visiblity: boolean) => {
    itemsRef.current[storyIndex]?.handleLongPress(visiblity);
  };

  const {
    storyIndex,
    onViewRef,
    viewabilityConfig,
    gestureHandler,
    onScroll,
    scrollX,
    listAnimatedStyle,
    isKeyboardVisible,
  } = useMultiStoryContainer(
    flatListRef,
    props,
    onScrollBeginDrag,
    onScrollEndDrag,
    handleLongPress,
    onComplete
  );

  useEffect(() => {
    onUserStoryIndexChange?.(storyIndex);
  }, [onUserStoryIndexChange, storyIndex]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={() => onComplete?.()}>
      <GestureHandlerRootView style={styles.rootViewStyle}>
        <GestureDetector gesture={gestureHandler}>
          <Animated.View
            style={{
              height: Metrics.windowHeight,
              width: Metrics.windowWidth,
            }}>
            <FlashList
              horizontal
              pagingEnabled
              bounces={false}
              data={stories}
              scrollEnabled={!isKeyboardVisible}
              ref={flatListRef}
              onScroll={onScroll}
              onScrollBeginDrag={onScrollBeginDrag}
              onScrollEndDrag={onScrollEndDrag}
              scrollEventThrottle={16}
              initialScrollIndex={storyIndex}
              estimatedItemSize={Metrics.windowWidth}
              overrideItemLayout={layout => {
                layout.size = Metrics.windowWidth;
              }}
              keyboardShouldPersistTaps="handled"
              onLayout={() => setIsTransitionActive(true)}
              onViewableItemsChanged={onViewRef.current}
              viewabilityConfig={viewabilityConfig.current}
              keyExtractor={item => item?.title + item?.id?.toString()}
              extraData={storyIndex}
              renderItem={({ item, index }: ListItemProps) => (
                <Animated.View
                  style={[
                    {
                      height: Metrics.windowHeight,
                      width: Metrics.windowWidth,
                    },
                    listAnimatedStyle,
                  ]}>
                  <MultiStoryListItem
                    ref={(elements: any) =>
                      (itemsRef.current[index] = elements)
                    }
                    {...{
                      item,
                      index,
                      storyIndex,
                      onComplete,
                      viewedStories,
                      scrollX,
                      isTransitionActive,
                      flatListRef,
                      storyLength: stories.length,
                    }}
                    {...props}
                  />
                </Animated.View>
              )}
            />
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default memo(MultiStoryContainer);
