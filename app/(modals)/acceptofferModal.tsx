// components/AcceptOfferModal.tsx
import { Alert, Modal, StyleSheet, TextInput, View } from 'react-native';
import React, { useState } from 'react';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import Typo from '@/components/Typo';
import Button from '@/components/Button';
import { verticalScale } from '@/utils/styling';

type AcceptOfferModalProps = {
  visible: boolean;
  onClose: () => void;
  onAccept: (price: string, details: string) => void;
};

const AcceptOfferModal = ({ visible, onClose, onAccept }: AcceptOfferModalProps) => {
  const [price, setPrice] = useState('');
  const [details, setDetails] = useState('');

  const handleAccept = () => {
    if (!price) {
      Alert.alert('Error', 'Please enter a price');
      return;
    }
    onAccept(price, details);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Typo size={18} fontWeight="600" style={styles.title}>
            Accept Offer
          </Typo>
          
          <Typo size={14} style={styles.label}>
            Final Price
          </Typo>
          <TextInput
            style={styles.input}
            placeholder="Enter final price"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          
          <Typo size={14} style={styles.label}>
            Details (Optional)
          </Typo>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Enter any additional details"
            multiline
            numberOfLines={4}
            value={details}
            onChangeText={setDetails}
          />
          
          <View style={styles.buttonsContainer}>
            <Button
              onPress={onClose}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button
              onPress={handleAccept}
              style={styles.button}
            >
              Confirm
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacingX._20,
  },
  container: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius._12,
    padding: spacingX._20,
  },
  title: {
    marginBottom: verticalScale(20),
    textAlign: 'center',
  },
  label: {
    marginBottom: verticalScale(5),
    color: colors.neutral500,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._8,
    padding: spacingX._12,
    marginBottom: verticalScale(15),
  },
  multilineInput: {
    height: verticalScale(100),
    textAlignVertical: 'top',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(10),
  },
  button: {
    flex: 1,
    marginHorizontal: spacingX._5,
  },
});

export default AcceptOfferModal;