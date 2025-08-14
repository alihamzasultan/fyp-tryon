import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import Typo from '@/components/Typo';
import Button from '@/components/Button';
import { AdType } from '@/types';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';

const { width, height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  ad: AdType | null;
  onClose: () => void;
}

const AdDetailModal: React.FC<Props> = ({ visible, ad, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  if (!ad) return null;

  const onScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / (width));
    setCurrentIndex(newIndex);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false} // Remove transparency for full screen
      onRequestClose={onClose}
    >
  <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.neutral900 }]}>
  <View style={[styles.modalContainer, { backgroundColor: colors.neutral900 }]}>
      <Header
                    title={"Product Details"}
                   
                    style={{ marginBottom: spacingY._20 }}
                />
        <ScrollView contentContainerStyle={{ paddingBottom: spacingY._20 }}>
          {/* Image Carousel */}
          {ad.images && ad.images.length > 0 && (
            <View>
              <FlatList
                ref={flatListRef}
                data={ad.images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                )}
                onScroll={onScroll}
                scrollEventThrottle={16}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={width} // Snap to full width
              />
              {/* Image Indicator */}
              <View style={styles.indicatorContainer}>
                <Typo size={14} color={colors.white}>
                  {currentIndex + 1} / {ad.images.length}
                </Typo>
              </View>
            </View>
          )}

          {/* Title */}
          <Typo size={20} fontWeight="700" style={{ marginTop: 10 }}>
            {ad.title}
          </Typo>

          {/* Price */}
          <Typo size={16} color={colors.neutral200}>
            {ad.price ? `PKR ${ad.price.toLocaleString()}` : 'Price not listed'}
          </Typo>

          {/* Description */}
          <Typo size={14} color={colors.neutral500} style={{ marginTop: 8 }}>
            {ad.description}
          </Typo>

          {/* Close Button */}
          <Button style={{ marginTop: 15 }} onPress={onClose}>
            <Typo color={colors.black} fontWeight="700">Close</Typo>
          </Button>
        </ScrollView>
      </View>
      </SafeAreaView>
    </Modal>
  );
};

export default AdDetailModal;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white, // Make sure the SafeAreaView also has a background color
  },
  modalContainer: {
    flex: 1, // Take up the full screen
    backgroundColor: colors.white,
    padding: spacingX._15,
  },
  carouselImage: {
    width: width, // Full width of the screen
    height: verticalScale(350),
    borderRadius: 0, // Optional: Remove border radius for full screen look
    marginRight: 0, // Remove right margin
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
});