import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  RefreshControl,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typo from '@/components/Typo';
import ScreenWrapper from '@/components/ScreenWrapper';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import { useAuth } from '@/contexts/authContext';
import { useRouter } from 'expo-router';
import useFetchData from '@/hooks/useFetchData';
import { UserType, AdType, StoreType } from '@/types';
import AdDetailModal from '../(modals)/AdDetailModal';
import ShowAllChatsModal from '../(modals)/showallchatsModal';

const { width } = Dimensions.get('window');
const cardMargin = spacingX._10;
const cardWidth = (width - spacingX._20 * 2 - cardMargin) / 2;

const Home = () => {
  const [selectedAd, setSelectedAd] = useState<AdType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showChatsModal, setShowChatsModal] = useState(false);

  const { user, loading: userLoading } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: allUsers = [],
    loading: usersLoading,
    error: usersError,
  } = useFetchData<UserType>('users', []);

  const {
    data: allAds = [],
    loading: adsLoading,
    error: adsError,
  } = useFetchData<AdType>('ads', []);

  const openAdDetails = (ad: AdType) => {
    setSelectedAd(ad);
    setModalVisible(true);
  };

  const closeAdDetails = () => {
    setModalVisible(false);
    setSelectedAd(null);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const {
    data: allStores = [],
    loading: storesLoading,
    error: storesError,
  } = useFetchData<StoreType>('stores', []);

  
  const renderAdItem = ({ item }: { item: AdType }) => {
    const coverImage = item.images?.[0];
  
    // ✅ Match ad.uid with store.ownerId
    const store = allStores.find(storeDoc => storeDoc.ownerId === item.uid);
  
    return (
      <TouchableOpacity onPress={() => openAdDetails(item)}>
        <View style={styles.adCard}>
          {coverImage && (
            <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />
          )}
          <View style={styles.adContent}>
            <Typo size={16} fontWeight="600" style={{ marginTop: 6 }}>
              {item.title}
            </Typo>
            <Typo size={14} color={colors.primaryLight}>
              {item.price ? `PKR ${item.price.toLocaleString()}` : 'Price not listed'}
            </Typo>
  
            {/* Store Info */}
            {store ? (
              <View style={styles.storeInfo}>
                {store.logo ? (
                  <Image 
                    source={{ uri: store.logo }} 
                    style={styles.storeLogo} 
                    resizeMode="cover" 
                  />
                ) : (
                  <View style={[styles.storeLogo, { backgroundColor: colors.neutral700 }]}>
                    <Ionicons name="storefront-outline" size={12} color={colors.neutral400} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Typo size={12} style={{ marginLeft: 4 }}>
                    {store.name}
                  </Typo>
                  <Typo size={10} color={colors.neutral500} style={{ marginLeft: 4 }}>
                    {store.location || "Location not available"}
                  </Typo>
                </View>
              </View>
            ) : (
              <Typo size={10} color={colors.neutral500} style={{ marginTop: 4 }}>
                Store information not available
              </Typo>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  if (userLoading || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#111827" }}>
        <ActivityIndicator size="large" color="#4B9CE2" />
        <Typo size={16} style={{ marginTop: 10 }}>
          {userLoading ? 'Loading user data...' : 'No user authenticated'}
        </Typo>
      </View>
    );
  }
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        {/* Header */}
        <View style={styles.header}>
          <View style={{ gap: 4 }}>
            <Typo size={16} color={colors.neutral400}>Hello,</Typo>
            <Typo size={20} fontWeight="500">
            {user!.name || 'User'}
          </Typo>
          </View>
          <TouchableOpacity onPress={() => setShowChatsModal(true)}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={verticalScale(24)}
              color={colors.neutral200}
            />
          </TouchableOpacity>
          
        </View>

        {/* Ads Section */}
        <Typo size={18} fontWeight="600" style={{ marginBottom: spacingY._10 }}>
          Latest Ads
        </Typo>

        {adsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Typo style={{ marginTop: 8 }}>Loading ads...</Typo>
          </View>
        ) : allAds.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.neutral500} />
            <Typo style={{ marginTop: 8 }}>No ads found</Typo>
          </View>
        ) : (
          <FlatList
            data={allAds}
            renderItem={renderAdItem}
            keyExtractor={(item) => item.id || Math.random().toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>

      <AdDetailModal
        visible={modalVisible}
        ad={selectedAd}
        onClose={closeAdDetails}
        allStores={allStores}
      />

      <ShowAllChatsModal
        visible={showChatsModal}
        onClose={() => setShowChatsModal(false)}
      />
    </ScreenWrapper>
  );
};

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
    height: verticalScale(150),
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  adContent: {
    padding: 8,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  storeLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});

export default Home;