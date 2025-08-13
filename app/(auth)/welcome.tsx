import { Image, StyleSheet, Text, TouchableOpacity, View, Animated, Easing } from 'react-native';
import React, { useEffect, useRef } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import Button from '@/components/Button';
import { useRouter } from 'expo-router';

const Welcome = () => {
  const router = useRouter();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start floating animation when component mounts
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 10,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const floatingStyle = {
    transform: [{ translateY: floatAnim }],
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* login button & image */}
        <View>
          <TouchableOpacity onPress={() => router.push('/login')} style={styles.loginButton}>
            <Typo fontWeight="500" size={15}>Sign in</Typo>
          </TouchableOpacity>

          <Animated.View style={[styles.imageContainer, floatingStyle]}>
            <Image
              source={require('../../assets/images/welcome.png')}
              style={styles.welcomeImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* footer */}
        <View style={styles.footer}>
          <View style={{ alignItems: 'center' }}>
            {/* <Typo size={30} fontWeight="800">Shop the Latest</Typo> */}
            <Typo size={30} fontWeight="800">Try Before You Buy</Typo>
          </View>

          <View style={{ alignItems: 'center', gap: 2 }}>
            <Typo size={14} color={colors.textLight}>
            try trendy shirts, and order now
            </Typo>
          </View>

          <View style={styles.buttonContainer}>
            <Button onPress={() => router.push('/register')} >
              <Typo size={19} color={colors.neutral900} fontWeight={"600"}>
                Get Started
              </Typo>
            </Button>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacingY._7,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: verticalScale(100),
  },
  welcomeImage: {
    width: '100%',
    height: verticalScale(300),
  },
  loginButton: {
    alignSelf: 'flex-end',
    marginRight: spacingX._20,
  },
  footer: {
    backgroundColor: colors.neutral900,
    alignItems: 'center',
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(45),
    gap: spacingY._20,
    shadowColor: 'white',
    shadowOffset: { width: 0, height: -10 },
    elevation: 10,
    shadowRadius: 25,
    shadowOpacity: 0.15,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: spacingX._25,
  },
});