import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typo from '@/components/Typo';
import ScreenWrapper from '@/components/ScreenWrapper';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import { useAuth } from '@/contexts/authContext';
import { useRouter } from 'expo-router';
import useFetchData from '@/hooks/useFetchData';
import { UserType, AdType } from '@/types';
import AdDetailModal from '../(modals)/AdDetailModal';

const { width } = Dimensions.get('window');
const cardMargin = spacingX._10;
const cardWidth = (width - spacingX._20 * 2 - cardMargin) / 2;

const Home = () => {

  const [selectedAd, setSelectedAd] = useState<AdType | null>(null);
const [modalVisible, setModalVisible] = useState(false);

const openAdDetails = (ad: AdType) => {
  setSelectedAd(ad);
  setModalVisible(true);
};

const closeAdDetails = () => {
  setModalVisible(false);
  setSelectedAd(null);
};

  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: allUsers,
    loading: usersLoading,
    error: usersError,
  } = useFetchData<UserType>('users', []);

  const {
    data: allAds,
    loading: adsLoading,
    error: adsError,
  } = useFetchData<AdType>('ads', []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);
  const renderAdItem = ({ item }: { item: AdType }) => {
    const coverImage = item.images?.[0];
    return (
      <TouchableOpacity onPress={() => openAdDetails(item)}>
        <View style={styles.adCard}>
          {coverImage && (
            <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />
          )}
          <Typo size={16} fontWeight="600" style={{ marginTop: 6 }}>
            {item.title}
          </Typo>
          <Typo size={14} color={colors.neutral400}>
            {item.price ? `PKR ${item.price.toLocaleString()}` : 'Price not listed'}
          </Typo>
        </View>
      </TouchableOpacity>

      
    );
  };

  return (
    
    <ScreenWrapper>

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ gap: 4 }}>
            <Typo size={16} color={colors.neutral400}>Hello,</Typo>
            <Typo size={20} fontWeight="500">{user?.name}</Typo>
          </View>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={verticalScale(24)}
            color={colors.neutral200}
            onPress={() => router.push('/(modals)/chatsModal')}
          />


        </View>

        {/* Ads Section */}
        <Typo size={18} fontWeight="600" style={{ marginBottom: spacingY._10 }}>
          Latest Ads
        </Typo>

        {adsLoading ? (
          <Typo>Loading ads...</Typo>
        ) : allAds.length === 0 ? (
          <Typo>No ads found.</Typo>
        ) : (
          <FlatList
            data={allAds}
            renderItem={renderAdItem}
            keyExtractor={(_, index) => index.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </View>

      <AdDetailModal
  visible={modalVisible}
  ad={selectedAd}
  onClose={closeAdDetails}
/>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    marginTop: verticalScale(8),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacingY._15,
  },
  flatListContent: {
    paddingBottom: verticalScale(100),
  },
  adCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 8,
    overflow: 'hidden',
    width: cardWidth,
  },
  coverImage: {
    width: '100%',
    height: verticalScale(180),
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
});
