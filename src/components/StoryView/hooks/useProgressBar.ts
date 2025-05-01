import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { Colors } from '../../../theme';
import { ProgressBarProps, StroyTypes } from '../types';
import { ProgressState } from '../types';

const useProgressBar = ({
  active,
  index,
  storyIndex,
  videoDuration,
  currentIndex,
  duration,
  storyType,
  ...props
}: ProgressBarProps) => {
  const scaleRef = useRef(new Animated.Value(0));
  const scale = scaleRef?.current;
  const [width, setWidth] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(duration);
  const isVideoStory = useRef(storyType === StroyTypes.Video);
  // this variable will help when identifying an exception scenario for iOS
  const previousVideoDurationRef = useRef(0);

  // Restart ProgressBar when the story changes
  useEffect(() => {
    if (index === currentIndex) {
      scale.setValue(0);
      setRemainingTime(duration);
    }
  }, [storyIndex, currentIndex, index, scale, duration, setRemainingTime]);

  useEffect(() => {
    if (!isVideoStory.current) {
      const progressBarWidth =
        Number.parseInt(JSON.stringify(scaleRef.current), 10) ?? 0;
      setRemainingTime(duration - (progressBarWidth * duration) / width);
    }
  }, [props?.pause, width, duration]);

  const barActiveColor = props?.barStyle?.barActiveColor ?? Colors.activeColor;
  const barInActiveColor =
    props?.barStyle?.barInActiveColor ?? Colors.inActiveColor;
  const barHeight = props?.barStyle?.barHeight ?? 2;

  const getDuration = useCallback(() => {
    if (props.pause) {
      scale.stopAnimation();
      return 0;
    }
    if (remainingTime === 0) {
      return duration * 1000;
    }
    return remainingTime * 1000;
  }, [remainingTime, scale, props?.pause, duration]);

  useEffect(() => {
    if (!isVideoStory.current) {
      switch (active) {
        case ProgressState.Default:
          scale.setValue(0);
          break;
        case ProgressState.InProgress:
          if (props.isLoaded)
            Animated.timing(scale, {
              toValue: width,
              duration: getDuration(),
              easing: Easing.linear,
              useNativeDriver: false,
            }).start(({ finished }) => {
              if (finished) props?.next && props?.next();
            });
          else {
            scale.setValue(0);
          }
          break;
        case ProgressState.Completed:
          scale.setValue(width);
          break;
        case ProgressState.Paused:
          scale.setValue(Number.parseInt(JSON.stringify(scaleRef.current), 10));
          break;
        default:
          scale.setValue(0);
      }
    }
  }, [active, isVideoStory, getDuration, props, scale, width]);

  const logWithTimestamps = (message: string) => {
    const now = new Date();
    const timestamp = now.toLocaleString();
    // eslint-disable-next-line no-console
    console.log(`[${timestamp}] ${message}`);
  };

  useEffect(() => {
    const currentStoryDurationPlayed = videoDuration[currentIndex];
    const isStaleData =
      currentStoryDurationPlayed > 0 &&
      currentIndex > 0 &&
      currentStoryDurationPlayed - previousVideoDurationRef.current > 0.5;
    if (isVideoStory.current) {
      switch (active) {
        case ProgressState.Default:
          scale.setValue(0);
          break;
        case ProgressState.InProgress:
          if (props?.isLoaded) {
            if (isStaleData) {
              logWithTimestamps(
                `STALE DATA InProgress - index: ${index}, currentIndex: ${currentIndex}, width: ${width}, duration: ${duration}, videoDuration: ${currentStoryDurationPlayed}`
              );
              break;
            }
            const videoProgress: number =
              (width * currentStoryDurationPlayed) / duration;
            logWithTimestamps(
              `InProgress - index: ${index}, currentIndex: ${currentIndex}, width: ${width}, duration: ${duration}, videoDuration: ${currentStoryDurationPlayed}`
            );
            if (
              videoDuration[currentIndex] < duration &&
              index === currentIndex
            ) {
              scale.setValue(videoProgress);
              previousVideoDurationRef.current = currentStoryDurationPlayed;
            }
          } else {
            scale.setValue(0);
          }
          break;
        case ProgressState.Completed:
          if (isStaleData) {
            logWithTimestamps(
              `STALE DATA Completed - index: ${index}, currentIndex: ${currentIndex}, width: ${width}, duration: ${duration}, videoDuration: ${currentStoryDurationPlayed}`
            );
            break;
          }
          logWithTimestamps(
            `Completed - index: ${index}, currentIndex: ${currentIndex}, width: ${width}, duration: ${duration}, videoDuration: ${currentStoryDurationPlayed}`
          );
          previousVideoDurationRef.current = currentStoryDurationPlayed;
          scale.setValue(width);
          break;
        case ProgressState.Paused:
          scale.setValue(Number.parseInt(JSON.stringify(scaleRef.current), 10));
          break;
        default:
          scale.setValue(0);
      }
    }
  }, [
    index,
    currentIndex,
    active,
    videoDuration,
    duration,
    isVideoStory,
    props,
    scale,
    width,
  ]);

  return {
    barActiveColor,
    barInActiveColor,
    barHeight,
    scale,
    width,
    setWidth,
  };
};

export default useProgressBar;
