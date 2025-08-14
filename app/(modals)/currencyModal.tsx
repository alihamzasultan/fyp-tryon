import {
  Alert,
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import React, { useState } from 'react'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { scale, verticalScale } from '@/utils/styling'
import ModalWrapper from '@/components/ModalWrapper'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import Typo from '@/components/Typo'
import Button from '@/components/Button'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Updated currency list with symbols
const currencies = [
  { label: 'USD - US Dollar', symbol: '$' },
  { label: 'EUR - Euro', symbol: '€' },
  { label: 'JPY - Japanese Yen', symbol: '¥' },
  { label: 'GBP - British Pound', symbol: '£' },
  { label: 'INR - Indian Rupee', symbol: '₹' },
  { label: 'PKR - Pakistani Rupee', symbol: 'Rs' },
]

const CurrencyModal = () => {
  const [selectedCurrencyLabel, setSelectedCurrencyLabel] = useState<string | null>(null)
  const [selectedCurrencySymbol, setSelectedCurrencySymbol] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onConfirm = async () => {
    if (!selectedCurrencySymbol) {
      Alert.alert('Currency', 'Please select a currency')
      return
    }
  
    try {
      setLoading(true)
      await AsyncStorage.setItem('selectedCurrencySymbol', selectedCurrencySymbol)
      Alert.alert(
        'Currency Updated',
        'Your preferred currency has been updated.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      )
    } catch (e) {
      Alert.alert('Error', 'Failed to save currency')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title="Select Currency"
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        {/* Dropdown placed at the top */}
        <View style={styles.form}>
          <Typo color={colors.neutral200}>Choose your preferred currency</Typo>

          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.dropdownText}>
              {selectedCurrencyLabel || 'Select Currency'}
            </Text>
          </TouchableOpacity>

          {/* Dropdown Modal */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <ScrollView contentContainerStyle={styles.modalList}>
                  {currencies.map((currency, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedCurrencyLabel(currency.label)
                        setSelectedCurrencySymbol(currency.symbol)
                        setModalVisible(false)
                      }}
                    >
                      <Text style={styles.modalItemText}>{currency.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Button
                  onPress={() => setModalVisible(false)}
                  style={{ marginTop: spacingY._10 }}
                >
                  <Typo color={colors.black} fontWeight="700">Cancel</Typo>
                </Button>
              </View>
            </View>
          </Modal>
        </View>

        {/* Footer with Confirm button at the bottom */}
        <View style={styles.footer}>
          <Button onPress={onConfirm} loading={loading} style={{ flex: 1 }}>
            <Typo color={colors.black} fontWeight="700">Confirm</Typo>
          </Button>
        </View>
      </View>
    </ModalWrapper>
  )
}

export default CurrencyModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacingY._20,
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.neutral500,
    borderRadius: 8,
    paddingVertical: spacingY._7,
    paddingHorizontal: spacingX._10,
    backgroundColor: colors.neutral100,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.black,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: spacingX._20,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacingY._15,
    maxHeight: '60%',
  },
  modalList: {
    gap: spacingY._10,
  },
  modalItem: {
    paddingVertical: spacingY._7,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.black,
  },
})
