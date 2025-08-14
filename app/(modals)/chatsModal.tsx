import React from 'react';
import { View, StyleSheet } from 'react-native';
import Typo from '@/components/Typo';
import ScreenWrapper from '@/components/ScreenWrapper';
import { colors, spacingX, spacingY } from '@/constants/theme';

const ChatPageModal = () => {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Typo size={20} fontWeight="600" color={colors.neutral200}>
          Chats
        </Typo>
        <Typo size={14} color={colors.neutral400}>
          Your conversations will appear here.
        </Typo>
      </View>
    </ScreenWrapper>
  );
};

export default ChatPageModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._10,
  },
});
