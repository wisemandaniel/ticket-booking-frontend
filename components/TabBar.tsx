import React from 'react';
import { View, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Text } from '@react-navigation/elements';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  // Define icon and title mapping for each tab
  const tabConfig = {
    index: {
      icon: 'grid',
      title: t('Dashboard')
    },
    agencies: {
      icon: 'briefcase',
      title: t('agencies')
    },
    profile: {
      icon: 'user',
      title: t('profile')
    }
  };

  return (
    <View style={styles.tabbar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const { icon, title } = tabConfig[route.name] || { 
          icon: 'circle', 
          title: route.name 
        };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabbarItem}
          >
            <Feather
              name={icon}
              size={24}
              color={isFocused ? colors.primary : colors.text}
            />
            <Text style={{ 
              color: isFocused ? colors.primary : colors.text,
              fontSize: 12
            }}>
              {title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    position: 'absolute',
    bottom: Platform.select({ ios: 40, android: 20 }),
    left: '2%',
    right: '2%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 25,
    shadowColor: '#000',
    elevation: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 10,
    shadowOpacity: 0.1,
  },
  tabbarItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
});