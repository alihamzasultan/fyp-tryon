import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Typo from '@/components/Typo';
import ScreenWrapper from '@/components/ScreenWrapper';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/authContext';
import { firestore } from '@/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { RequestType } from '@/types';
import { verticalScale } from '@/utils/styling';
import { Image } from 'expo-image';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';

const FILTERS = ['pending', 'accepted', 'rejected'];

const CartModal = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  const fetchSentRequests = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const q = query(
        collection(firestore, 'requests'),
        where('senderUid', '==', user.uid) // requests SENT by the user
      );
      const snapshot = await getDocs(q);

      const requestData: RequestType[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as RequestType[];

      setRequests(requestData);
    } catch (error) {
      console.error('Error fetching sent requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentRequests();
  }, [user?.uid]);

  const filteredRequests = requests.filter(req => (req.status ?? 'pending') === activeFilter);

  const renderRequestItem = ({ item }: { item: RequestType }) => {
    const statusColor =
      item.status === 'accepted' ? colors.green :
      item.status === 'rejected' ? colors.error :
      colors.neutral500;

    return (
      <View style={styles.requestItemContainer}>
        {item.imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: item.imageUri }}
              style={styles.imagePreview}
              contentFit="cover"
            />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Typo size={16} fontWeight="600" color={colors.neutral50}>
            {item.message || 'No message'}
          </Typo>
          <Typo size={14} color={statusColor}>
            {item.status ?? 'pending'}
          </Typo>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
      <Header
                    title={"Orders"}
                    leftIcon={<BackButton/>}
                    style={{ marginBottom: spacingY._10 }}
                />
        <Typo size={20} fontWeight="600" color={colors.neutral200} style={{ marginBottom: spacingY._5 }}>
          Requests
        </Typo>
        <Typo size={14} color={colors.neutral400} style={{ marginBottom: spacingY._10 }}>
          Your sent requests
        </Typo>

        {/* Filter Buttons */}
        <View style={styles.filterRow}>
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => setActiveFilter(filter as any)}
            >
              <Typo
                color={activeFilter === filter ? colors.white : colors.neutral300}
                fontWeight="500"
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Typo>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Typo color={colors.neutral500}>No {activeFilter} requests found.</Typo>
          </View>
        ) : (
          <FlatList
            data={filteredRequests}
            keyExtractor={(item) => item.id ?? Math.random().toString()}
            renderItem={renderRequestItem}
            contentContainerStyle={{ paddingBottom: verticalScale(50) }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenWrapper>
  );
};

export default CartModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._10,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: spacingY._15,
    gap: spacingX._8,
  },
  filterButton: {
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._10,
    borderRadius: radius._8,
    backgroundColor: colors.neutral700,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  requestItemContainer: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    padding: spacingX._12,
    marginBottom: spacingY._10,
    flexDirection: 'row',
    gap: spacingX._10,
  },
  imagePreviewContainer: {
    width: 60,
    height: 60,
    borderRadius: radius._8,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
