import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Easing,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
  error: '#E53E3E',
  warning: '#DD6B20',
  success: '#38A169',
  info: '#3182CE',
  text: '#FFFFFF',
};

type SnackbarType = 'error' | 'success' | 'warning' | 'info';

interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: SnackbarType;
  actionText?: string;
  onActionPress?: () => void;
  onDismiss: () => void;
  duration?: number;
  multiline?: boolean;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  visible,
  message,
  type = 'error',
  actionText,
  onActionPress,
  onDismiss,
  duration = 4000,
  multiline = false,
}) => {
  const [animation] = useState(new Animated.Value(0));
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (visible) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        hideSnackbar();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const hideSnackbar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'error': return COLORS.error;
      case 'warning': return COLORS.warning;
      case 'success': return COLORS.success;
      case 'info': return COLORS.info;
      default: return COLORS.error;
    }
  };

  const getIconName = () => {
    switch (type) {
      case 'error': return 'alert-circle';
      case 'warning': return 'alert';
      case 'success': return 'check-circle';
      case 'info': return 'information';
      default: return 'alert-circle';
    }
  };

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [contentHeight + 16, 0], // Start offscreen by the height of the content
  });

  const handleContentLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setContentHeight(height);
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY }],
          minHeight: 56, // Minimum touch target size
        },
      ]}
      onLayout={handleContentLayout}
    >
      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <MaterialCommunityIcons
            name={getIconName()}
            size={24}
            color={COLORS.text}
            style={styles.icon}
          />
          <Text 
            style={[
              styles.message,
              multiline && styles.multilineMessage
            ]}
            numberOfLines={multiline ? undefined : 2}
          >
            {message}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            onPress={hideSnackbar} 
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons 
              name="close" 
              size={20} 
              color={COLORS.text} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 8,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 8,
  },
  icon: {
    marginRight: 12,
    alignSelf: 'flex-start',
    marginTop: 2, // Better alignment with text
  },
  message: {
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
    flexShrink: 1,
  },
  multilineMessage: {
    marginTop: 4,
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 8,
  },
  actionText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
});