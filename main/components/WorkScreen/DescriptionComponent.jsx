import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HtmlTextRenderer from '../common/HtmlTextRenderer';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const COLLAPSED_HEIGHT = 90;

export const WorkDescription = React.memo(({ work, currentTheme, jsonSettings }) => {
  const HTML_TAG_STYLES = {
    p: {
      fontSize: 14,
      paddingBottom: 12,
    },
    span: {
      fontSize: 14,
      paddingBottom: 12,
    },
    a: {
      fontSize: 14,
      paddingBottom: 12,
      color: currentTheme.primaryColor,
      textDecorationLine: 'underline'
    },
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);

  const animatedHeight = useSharedValue(COLLAPSED_HEIGHT);

  const toggleDescription = useCallback(() => {
    const targetState = !isExpanded;
    const targetHeight = targetState ? (fullHeight || COLLAPSED_HEIGHT) : COLLAPSED_HEIGHT;

    animatedHeight.value = withTiming(targetHeight, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(setIsExpanded)(targetState);
      }
    });

    setIsExpanded(targetState);
  }, [isExpanded, fullHeight, animatedHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: 'hidden',
  }));

  const gradientStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedHeight.value,
      [COLLAPSED_HEIGHT, COLLAPSED_HEIGHT + 30],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      zIndex: opacity === 0 ? -1 : 2
    };
  });

  if (!work?.description) return null;

  const renderedContent = useMemo(() => {
    return (
      <View style={styles.contentPadding}>
        {jsonSettings?.preferHtml ? (
          <HtmlTextRenderer
            currentTheme={currentTheme}
            html={work.descriptionHTML}
            extraTagsStyles={HTML_TAG_STYLES}
          />
        ) : (
          <Text style={[styles.description, { color: currentTheme.textColor }]}>
            {work.description}
          </Text>
        )}
      </View>
    );
  }, [work.descriptionHTML, work.description, currentTheme, jsonSettings?.preferHtml]);

  const isActuallyTall = fullHeight > COLLAPSED_HEIGHT;

  return (
    <View style={styles.descriptionContainer}>
      <View
        style={styles.hiddenMeasurer}
        pointerEvents="none"
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - fullHeight) > 1) {
            setFullHeight(h);
            if (isExpanded) animatedHeight.value = h;
          }
        }}
      >
        {renderedContent}
      </View>

      <Animated.View style={[styles.descriptionWrapper, animatedStyle]}>
        {renderedContent}

        {isActuallyTall && (
          <Animated.View
            style={[styles.descriptionGradient, gradientStyle]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[`${currentTheme.backgroundColor}00`, currentTheme.backgroundColor]}
              style={{ flex: 1 }}
            />
          </Animated.View>
        )}
      </Animated.View>

      {isActuallyTall && (
        <TouchableOpacity style={styles.expandButton} onPress={toggleDescription}>
          <Icon
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={32}
            color={currentTheme.primaryColor}
          />
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  descriptionContainer: {
    marginTop: 10,
    paddingHorizontal: 16,
    position: 'relative',
  },
  hiddenMeasurer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    opacity: 0,
    zIndex: -10,
  },
  descriptionWrapper: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  contentPadding: {
    paddingBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  descriptionGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 2,
  },
  expandButton: {
    alignSelf: 'center',
    paddingVertical: 4,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
});