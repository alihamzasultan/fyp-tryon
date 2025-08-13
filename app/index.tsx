import { Image, StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router'; // Make sure it's correct for your project
import { colors } from '@/constants/theme';

const Index = () => {

  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        resizeMode="contain"
        source={require('../assets/images/coin.png')}
      />
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral900,
  },
  logo: {
    height: '20%',
    aspectRatio: 1,
  },
});
