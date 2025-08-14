import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Typo from '@/components/Typo';
import ModalWrapper from '@/components/ModalWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { scale, verticalScale } from '@/utils/styling';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { firestore } from '@/config/firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { RequestType } from '@/types';
import { Image } from 'expo-image';

const AdRequestsModal = () => {
  const router = useRouter();
  const { adId } = useLocalSearchParams<{ adId?: string }>();
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!adId) return;
    
      setLoading(true);
      try {
        const q = query(
          collection(firestore, 'requests'),
          where('adId', '==', adId)
        );
        const snapshot = await getDocs(q);
    
        const requestData: RequestType[] = await Promise.all(
          snapshot.docs.map(async docSnap => {
            const data = docSnap.data() as RequestType;
            // fetch sender's name from users collection
            let senderName = 'Unknown';
            if (data.senderUid) {
              const userDoc = await getDocs(
                query(collection(firestore, 'users'), where('uid', '==', data.senderUid))
              );
              if (!userDoc.empty) {
                senderName = userDoc.docs[0].data().name || 'Unknown';
              }
            }
            return {
              id: docSnap.id,
              ...data,
              senderName, // add senderName here
            };
          })
        );
    
        setRequests(requestData);
      } catch (error) {
        console.error('Error fetching requests:', error);
        Alert.alert('Error', 'Failed to load requests.');
      } finally {
        setLoading(false);
      }
    };
    

    fetchRequests();
  }, [adId]);

  const updateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const requestDocRef = doc(firestore, 'requests', requestId);
      await updateDoc(requestDocRef, { status, seen: true });

      setRequests(prev =>
        prev.map(req => req.id === requestId ? { ...req, status, seen: true } : req)
      );
      Alert.alert('Success', `Request ${status}.`);
    } catch (error) {
      console.error('Error updating request status:', error);
      Alert.alert('Error', 'Failed to update request status.');
    }
  };

  const renderRequestItem = ({ item }: { item: RequestType }) => {
    const status = item.status ?? 'pending'; // default to 'pending'
    const statusColor =
      status === 'accepted' ? colors.green :
      status === 'rejected' ? colors.error :
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
        <View style={styles.requestContent}>
        <Typo size={16} fontWeight="600" color={colors.neutral50}>
          {item.senderName}
        </Typo>

          <Typo size={14} color={colors.neutral300}>
            {item.message}
          </Typo>
        </View>
        <View style={styles.requestActions}>
          {status === 'pending' && (
            <>
              <TouchableOpacity style={styles.acceptButton} onPress={() => updateRequestStatus(item.id!, 'accepted')}>
                <Typo color={colors.green} fontWeight="600">Accept</Typo>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton} onPress={() => updateRequestStatus(item.id!, 'rejected')}>
                <Typo color={colors.error} fontWeight="600">Reject</Typo>
              </TouchableOpacity>
            </>
          )}
          {status !== 'pending' && (
            <Typo size={14} color={statusColor} fontWeight="500">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Typo>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title="Ad Requests"
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />
        {loading ? (
          <View style={styles.loadingContainer}>
            <Typo>Loading requests...</Typo>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Typo>No requests found for this ad.</Typo>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id ?? Math.random().toString()}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacingX._20 },
  flatListContent: { paddingBottom: verticalScale(100) },
  requestItemContainer: {
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingX._12,
    marginBottom: spacingY._10,
  },
  imagePreviewContainer: {
    width: scale(120),
    height: verticalScale(120),
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: spacingY._8,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  requestContent: { marginBottom: spacingY._8 },
  requestActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacingX._8 },
  acceptButton: { paddingHorizontal: spacingX._12, paddingVertical: spacingY._8, borderRadius: 8, backgroundColor: colors.neutral700 },
  rejectButton: { paddingHorizontal: spacingX._12, paddingVertical: spacingY._8, borderRadius: 8, backgroundColor: colors.errorLight },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default AdRequestsModal;
