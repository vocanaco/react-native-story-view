import React, { memo, useEffect, useRef, useState } from 'react';
import { Modal, View } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { Colors, Metrics } from '../../theme';
import { Footer } from '../Footer';
import {
  Indicator,
  ProfileHeader,
  StoryContainer,
  StoryRef,
} from '../StoryView';
import { useMultiStoryContainer, useDraggableGesture } from './hooks';
import styles from './styles';
import {
  ListItemProps,
  MultiStoryContainerProps,
  MultiStoryListItemProps,
  SwipeDownValue,
  TransitionMode,
} from './types';
import {
  cubeTransition,
  defaultTransition,
  scaleTransition,
} from './utils/StoryTransitions';

const MultiStoryListItem = memo(
  ({
    item,
    index,
    scrollX,
    storyIndex,
    onComplete,
    viewedStories,
    isTransitionActive,
    isCurrentStory,
    storyLength,
    flatListRef,
    ...props
  }: MultiStoryListItemProps) => {
    const storyRef = useRef<StoryRef>(null);
    const isSwipeDown: SwipeDownValue = useSharedValue(false);

    const storyInitialIndex: number = viewedStories?.[index]?.findIndex(
      (val: boolean) => !val
    );

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

    const onScrollBegin = () => storyRef?.current?.pause(true);
    const onScrollEnd = () => storyRef?.current?.pause(false);
    const handleLongPress = (visibility: boolean) =>
      storyRef?.current?.handleLongPress(visibility);

    const animationStyle = useAnimatedStyle(() => {
      switch (props.transitionMode) {
        case TransitionMode.Cube:
          return cubeTransition(index, scrollX);
        case TransitionMode.Scale:
          return scaleTransition(index, scrollX);
        default:
          return defaultTransition();
      }
    }, [index, scrollX.value]);

    const { gestureHandler, listAnimatedStyle } = useDraggableGesture({
      backgroundColor: Colors.black,
      onComplete,
      onScrollBeginDrag: onScrollBegin,
      onScrollEndDrag: onScrollEnd,
      handleLongPress: handleLongPress,
      isSwipeDown,
    });

    return (
      <GestureHandlerRootView style={styles.rootViewStyle}>
        <GestureDetector gesture={gestureHandler}>
          <Animated.View style={listAnimatedStyle}>
            <View key={item.id} style={styles.itemContainer}>
              {isCurrentStory || isTransitionActive ? (
                <Animated.View style={animationStyle}>
                  {[
                    index - 2,
                    index - 1,
                    index,
                    index + 1,
                    index + 2,
                    index + 3,
                  ].includes(storyIndex) && (
                    <StoryContainer
                      visible={true}
                      extended={false}
                      key={index + item?.id}
                      ref={storyRef}
                      userStories={item}
                      nextStory={nextStory}
                      previousStory={previousStory}
                      stories={item.stories}
                      progressIndex={
                        storyInitialIndex < 0 ? 0 : storyInitialIndex
                      }
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
                  )}
                </Animated.View>
              ) : (
                props?.renderIndicatorComponent?.() ?? <Indicator />
              )}
            </View>
          </Animated.View>
        </GestureDetector>
        {/* </PanGestureHandler> */}
      </GestureHandlerRootView>
    );
  }
  // )
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

  const [isTransitionActive, setIsTransitionActive] = useState<boolean>(false);

  const { storyIndex, onViewRef, viewabilityConfig, onScroll, scrollX } =
    useMultiStoryContainer(flatListRef, props);

  useEffect(() => {
    onUserStoryIndexChange?.(storyIndex);
  }, [onUserStoryIndexChange, storyIndex]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={() => onComplete?.()}>
      <Animated.FlatList
        horizontal
        bounces={false}
        style={styles.list}
        windowSize={10}
        snapToAlignment={'start'}
        pagingEnabled
        initialNumToRender={2}
        maxToRenderPerBatch={10}
        data={stories}
        ref={flatListRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        initialScrollIndex={storyIndex}
        keyboardShouldPersistTaps="handled"
        getItemLayout={(_, index) => ({
          length: Metrics.screenWidth,
          offset: Metrics.screenWidth * index,
          index,
        })}
        onLayout={() => setIsTransitionActive(true)}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewabilityConfig.current}
        decelerationRate={Metrics.isIOS ? 0.99 : 0.92}
        keyExtractor={item => item?.title + item?.id?.toString()}
        contentContainerStyle={{
          width: Metrics.screenWidth * stories.length,
        }}
        extraData={storyIndex}
        renderItem={({ item, index }: ListItemProps) => {
          return (
            <MultiStoryListItem
              {...{
                item,
                index,
                storyIndex,
                onComplete,
                viewedStories,
                scrollX,
                isTransitionActive,
                storyLength: stories.length,
                flatListRef: flatListRef,
                isCurrentStory: storyIndex === index,
              }}
              {...props}
            />
          );
        }}
      />
    </Modal>
  );
};

export default MultiStoryContainer;
