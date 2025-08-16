import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/contexts/authContext';
import { firestore } from '@/config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const ICON_SIZE = 26;
const TOUCH_MIN_SIZE = 45;
const TAB_BAR_HEIGHT = 70;

export default function CustomTabs({ state, descriptors, navigation }: BottomTabBarProps) {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  // 🔴 Listen for pending requests
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(firestore, 'requests'),
      where('receiverUid', '==', user.uid) // receiver = current user
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const count = snapshot.docs.filter(docSnap => {
        const status = docSnap.data().status;
        return status !== 'accepted' && status !== 'rejected';
      }).length;
      setPendingCount(count);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const tabbarIcons: any = {
    index: (isFocused: boolean) => (
      <Feather
        name="home"
        size={ICON_SIZE}
        color={isFocused ? colors.primary : colors.neutral400}
      />
    ),
    statistics: (isFocused: boolean) => (
      <View>
        <Feather
          name={!user?.isBuyer ? "list" : "shopping-cart"}
          size={ICON_SIZE}
          color={isFocused ? colors.primary : colors.neutral400}
        />
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {pendingCount > 99 ? '99+' : pendingCount}
            </Text>
          </View>
        )}
      </View>
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
            onPress={onPress}
            activeOpacity={0.6}
            style={[styles.tabbarItem, { minWidth: TOUCH_MIN_SIZE, minHeight: TOUCH_MIN_SIZE }]}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
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
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
