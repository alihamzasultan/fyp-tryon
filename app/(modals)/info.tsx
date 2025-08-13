import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { scale, verticalScale } from '@/utils/styling'
import ModalWrapper from '@/components/ModalWrapper'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import Typo from '@/components/Typo'

const DeveloperContact = () => {
  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title="Developer Contact"
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.infoBox}>
            <Typo  size={16} color={colors.neutral400}>
              Have any suggestion? reach out on:
            </Typo>
            <Typo  size={16} color={colors.neutral300}>
             alihamzasultan6@gmail.com
            </Typo>
         
          </View>
        </ScrollView>
      </View>
    </ModalWrapper>
  )
}

export default DeveloperContact

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacingY._20,
  },
  form: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacingY._20,
    paddingVertical: spacingY._20,
  },
  infoBox: {
    alignItems: 'center',
    gap: spacingY._10,
  },
  email: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral50,
    marginTop: spacingY._5,
  },
})
