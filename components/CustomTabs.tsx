import { View, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';

// Constants for consistent sizing
const ICON_SIZE = 26;
const TOUCH_MIN_SIZE = 45; // Minimum recommended touch target size (48x48px)
const TAB_BAR_HEIGHT = 70; // Fixed height for tab bar

export default function CustomTabs({
  state,
  descriptors,
  navigation
}: BottomTabBarProps) {
  const tabbarIcons: any = {
    index: (isFocused: boolean) => (
      <Feather
        name="home"
        size={ICON_SIZE}
        color={isFocused ? colors.primary : colors.neutral400}
      />
    ),
    statistics: (isFocused: boolean) => (
      <Feather
        name="list"
        size={ICON_SIZE}
        color={isFocused ? colors.primary : colors.neutral400}
      />
    ),
    profile: (isFocused: boolean) => (
      <Feather
        name="user"
        size={ICON_SIZE}
        color={isFocused ? colors.primary : colors.neutral400}
      />
    ),

    
    tryon: (isFocused: boolean) => (
      <Ionicons
        name="shirt-outline"
        size={ICON_SIZE}
        color={isFocused ? colors.primary : colors.neutral400}
      />
    ),
  };

  return (
    <View style={[styles.tabbar, { height: TAB_BAR_HEIGHT }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            key={route.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            activeOpacity={0.6}
            style={[styles.tabbarItem, { 
              minWidth: TOUCH_MIN_SIZE,
              minHeight: TOUCH_MIN_SIZE 
            }]}
            hitSlop={{
              top: 16,
              bottom: 16,
              left: 16,
              right: 16,
            }}
          >
            <View style={styles.iconContainer}>
              {tabbarIcons[route.name] && tabbarIcons[route.name](isFocused)}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: colors.neutral800,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopColor: colors.neutral700,
    borderTopWidth: 1,
    paddingHorizontal: 16,
  },
  tabbarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: 'center',
  },
  iconContainer: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  }
});