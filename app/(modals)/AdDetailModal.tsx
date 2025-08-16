import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
  Dimensions,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import Typo from '@/components/Typo';
import Button from '@/components/Button';
import { AdType, StoreType } from '@/types';
import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '@/components/BackButton';
import ChatModal from './chatModal';

const { width, height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  ad: AdType | null;
  onClose: () => void;
  allStores: StoreType[];
}
const ModalBackButton = ({ onPress, iconSize = 26 }: { onPress: () => void; iconSize?: number }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.backButton}
    >
       <Ionicons
        name="arrow-back"
        size={verticalScale(iconSize)}
        color={colors.white}
      />
    </TouchableOpacity>
  );
};

const AdDetailModal: React.FC<Props> = ({ visible, ad, onClose, allStores }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  // ... existing states ...

  const openChatModal = () => {
    setChatModalVisible(true);
  };

  const closeChatModal = () => {
    setChatModalVisible(false);
  };

  if (!ad) return null;

  // Find the store associated with this ad
  const store = allStores.find(store => store.ownerId === ad.uid);

  const onScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / width);
    setCurrentIndex(newIndex);
  };

  const openStoreModal = () => {
    if (store) {
      setSelectedStore(store);
      setStoreModalVisible(true);
    }
  };

  const closeStoreModal = () => {
    setStoreModalVisible(false);
    setSelectedStore(null);
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.neutral900 }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.neutral900 }]}>
          <Header
              title={"Product Details"}
              style={{ marginBottom: spacingY._20 }}
              leftIcon={<ModalBackButton onPress={onClose} />}
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
                    snapToInterval={width}
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


               {/* Store Info */}
               {store && (
                <TouchableOpacity onPress={openStoreModal}>
                  <View style={styles.storeContainer}>
                    {store.logo ? (
                      <Image 
                        source={{ uri: store.logo }} 
                        style={styles.storeLogo} 
                        resizeMode="cover" 
                      />
                    ) : (
                      <View style={[styles.storeLogo, { backgroundColor: colors.neutral700 }]}>
                        <Ionicons name="storefront-outline" size={16} color={colors.neutral200} />
                      </View>
                    )}
                    <View style={styles.storeTextContainer}>
                      <Typo size={14} fontWeight="400">
                        {store.name}
                      </Typo>
                      {store.location && (
                        <Typo size={12} color={colors.neutral500}>
                          {store.location}
                        </Typo>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.neutral500} />
                  </View>
                </TouchableOpacity>
              )}

            {store && (
                    <Button 
                      style={{ marginTop: spacingY._10 }} 
                      onPress={openChatModal}
                 
                    >
                      <Typo color={colors.white} fontWeight="700">Chat with Seller</Typo>
                    </Button>
                  )}
                   {/* Add the ChatModal at the bottom of the component */}
                <ChatModal
                  visible={chatModalVisible}
                  onClose={closeChatModal}
                  sellerId={ad?.uid || ''}
                  adId={ad?.id || ''}
                />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Store Detail Modal */}
      <Modal
        visible={storeModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeStoreModal}
      >
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.neutral900 }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.neutral900 }]}>
          <Header
              title={"Store Details"}
              style={{ marginBottom: spacingY._20 }}
              leftIcon={<ModalBackButton onPress={closeStoreModal} />}
            />
            {selectedStore && (
              <ScrollView contentContainerStyle={{ paddingBottom: spacingY._20 }}>
                {/* Store Banner */}
                {selectedStore.banner && (
                  <Image
                    source={{ uri: selectedStore.banner }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                )}

                {/* Store Logo and Name */}
                <View style={styles.storeHeader}>
                  {selectedStore.logo ? (
                    <Image 
                      source={{ uri: selectedStore.logo }} 
                      style={styles.storeDetailLogo} 
                      resizeMode="cover" 
                    />
                  ) : (
                    <View style={[styles.storeDetailLogo, { backgroundColor: colors.neutral700 }]}>
                      <Ionicons name="storefront-outline" size={24} color={colors.neutral400} />
                    </View>
                  )}
                  <Typo size={14} fontWeight="700" style={{ marginLeft: spacingX._10 }}>
                    {selectedStore.name}
                  </Typo>
                </View>

                {/* Store Location */}
                {selectedStore.location && (
                  <View style={styles.storeInfoRow}>
                    <Ionicons name="location-outline" size={16} color={colors.neutral500} />
                    <Typo size={14} color={colors.neutral300} style={{ marginLeft: 6 }}>
                      {selectedStore.location}
                    </Typo>
                  </View>
                )}

                {/* Store Description */}
                <Typo size={14} color={colors.neutral300} style={{ marginTop: spacingY._10 }}>
                  {selectedStore.description}
                </Typo>

                {/* Close Button */}
                <Button style={{ marginTop: 15 }} onPress={closeStoreModal}>
                  <Typo color={colors.black} fontWeight="700">Close</Typo>
                </Button>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacingX._15,
  },
  backButton: {
    backgroundColor: colors.neutral600,
    alignSelf: "flex-start",
    borderRadius: radius._10,
    borderCurve: "continuous",
    padding: 5,
    marginRight: 10,
  },

  carouselImage: {
    width: width,
    height: verticalScale(350),
    borderRadius: 0,
    marginRight: 0,
  },
  bannerImage: {
    width: '100%',
    height: verticalScale(200),
    borderRadius: 8,
    marginBottom: spacingY._10,
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
  storeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacingY._20,
    marginBottom: spacingY._10,
    padding: spacingX._10,
    backgroundColor: colors.neutral800,
    borderRadius: 8,
  },
  storeLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeDetailLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.neutral700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeTextContainer: {
    marginLeft: spacingX._10,
    flex: 1,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  storeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacingY._5,
  },
});

export default AdDetailModal;