import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import { scale, verticalScale } from '@/utils/styling';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import Header from '@/components/Header';
import Typo from '@/components/Typo';
import { useAuth } from '@/contexts/authContext';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, doc, deleteDoc, getCountFromServer } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { AdType } from '@/types';
import BackButton from '@/components/BackButton';
import { MaterialIcons } from '@expo/vector-icons';

const Statistics = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState<AdType[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requestCounts, setRequestCounts] = useState<{ [adId: string]: number }>({});

  const fetchUserAds = async (isRefresh = false) => {
    if (!user?.uid) return;
  
    try {
      if (!isRefresh) setLoading(true);
  
      const q = query(
        collection(firestore, 'ads'),
        where('uid', '==', user.uid)
      );
      const snapshot = await getDocs(q);
  
      const userAds = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AdType[];
  
      setAds(userAds);
  
      const requestCountsPromises = userAds.map(async (ad) => {
        const requestsQuery = query(
          collection(firestore, 'requests'),
          where('adId', '==', ad.id),
          where('receiverUid', '==', user.uid),
          where('status', '==', 'UNSEEN')  // only unseen requests
        );
        const snapshot = await getCountFromServer(requestsQuery);
        return { adId: ad.id, count: snapshot.data().count };
      });
  
      const counts = await Promise.all(requestCountsPromises);
      const countsObject: { [adId: string]: number } = {};
      counts.forEach(({ adId, count }) => {
        if (adId) countsObject[adId] = count;
      });
      setRequestCounts(countsObject);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load your ads');
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };
  

  useEffect(() => {
    if (user?.uid) {
      fetchUserAds();
    }
  }, [user?.uid]);
  

  const onRefresh = useCallback(() => {
    fetchUserAds(true);
  }, []);

  const handleEdit = (adId: string) => {
    router.push({ pathname: '/(modals)/addModal', params: { adId } });
  };

  const handleDelete = (adId: string) => {
    Alert.alert('Delete Ad', 'Are you sure you want to delete this ad?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(firestore, 'ads', adId));
          setAds((prev) => prev.filter((ad) => ad.id !== adId));
          Alert.alert('Success', 'Ad deleted successfully');
        },
      },
    ]);
  };

  const handleViewRequests = (adId: string) => {
    router.push({ pathname: '/(modals)/adrequestModal', params: { adId } });
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header
          title="My Ads"
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Typo style={styles.loadingText}>Loading your ads...</Typo>
            </View>
          ) : ads.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Typo color={colors.neutral500} style={styles.emptyStateText}>
                You haven't posted any ads yet.
              </Typo>
            </View>
          ) : (
            ads.map((ad) => (
              <View key={ad.id} style={styles.adCard}>
                {ad.images?.[0] && (
                  <Image
                    source={{ uri: ad.images[0] }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.adContent}>
                  <View style={styles.titleRow}>
                    <Typo size={16} fontWeight="600" style={styles.titleText}>
                      {ad.title}
                    </Typo>
                    <TouchableOpacity onPress={() => handleDelete(ad.id!)} style={styles.deleteButton}>
                      <MaterialIcons name="delete" size={22} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  <Typo size={14} color={colors.neutral600}>
                    PKR {ad.price?.toLocaleString?.() || 'N/A'}
                  </Typo>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.viewRequestsButton]}
                      onPress={() => handleViewRequests(ad.id!)}
                    >
                      <Typo color={colors.neutral600} fontWeight="400">Requests</Typo>
                      {requestCounts[ad.id!] > 0 && (
                        <View style={styles.notificationBadge}>
                          <Typo size={10} color={colors.white}>{requestCounts[ad.id!]}</Typo>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editActionButton]}
                      onPress={() => handleEdit(ad.id!)}
                    >
                      <Typo color={colors.primary} fontWeight="600">Edit</Typo>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default Statistics;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._10,
    backgroundColor: colors.neutral900,
  },
  scrollContent: {
    paddingBottom: verticalScale(100),
    gap: spacingY._15,
  },
  adCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral50,
    borderRadius: radius._12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: spacingY._10,
  },
  image: { width: scale(100), height: scale(100) },
  adContent: {
    flex: 1,
    padding: spacingX._10,
    justifyContent: 'space-between',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: spacingY._5,
  },
  actionButton: {
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._8,
    borderRadius: radius._8,
    marginRight: spacingX._8,
  },
  editActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  viewRequestsButton: {
    backgroundColor: colors.neutral200,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._3,
  },
  titleText: {
    flex: 1,
    marginRight: spacingX._5,
    fontSize: 16,
    color: colors.neutral800,
  },
  deleteButton: {
    padding: spacingX._5,
    borderRadius: radius._5,
    backgroundColor: colors.errorLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacingY._30,
  },
  loadingText: { marginTop: spacingY._10, color: colors.neutral500 },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacingY._30,
  },
  emptyStateText: { fontSize: 16, color: colors.neutral500 },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
