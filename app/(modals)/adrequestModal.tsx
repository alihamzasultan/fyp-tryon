// AdRequestsModal.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typo from '@/components/Typo';
import ModalWrapper from '@/components/ModalWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { scale, verticalScale } from '@/utils/styling';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { firestore } from '@/config/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { RequestType } from '@/types';
import { Image } from 'expo-image';  // Import expo-image

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
        const requestData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as RequestType[];
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

  const handleAccept = async (requestId: string) => {
    await updateRequestStatus(requestId, 'accepted');
  };

  const handleReject = async (requestId: string) => {
    await updateRequestStatus(requestId, 'rejected');
  };

  const updateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const requestDocRef = doc(firestore, 'requests', requestId);
      await updateDoc(requestDocRef, { status });
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId ? { ...req, status } : req
        )
      );
      Alert.alert('Success', `Request ${status}.`);
    } catch (error) {
      console.error('Error updating request status:', error);
      Alert.alert('Error', 'Failed to update request status.');
    }
  };


  const renderRequestItem = ({ item }: { item: RequestType }) => {
    const statusColor =
    item.status === 'accepted'
        ? colors.green
        : item.status === 'rejected'
        ? colors.error
        : colors.neutral500;


    return (
      <View style={styles.requestItemContainer}>
        <View style={styles.requestContent}>
        {item.imageUri && (
            <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: item.imageUri }}
                  style={styles.imagePreview}
                  contentFit="contain"
                />
              </View>
          )}
            <Typo size={14} color={colors.neutral400}>
            {item.message}
          </Typo>
          <Typo size={14} color={colors.neutral400}>
            Sender UID: {item.senderUid}
          </Typo>
        </View>
        <View style={styles.requestActions}>
          {item.status !== 'accepted' && item.status !== 'rejected' && (
            <>
              <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item.id!)}>
                <Typo color={colors.green} fontWeight="600">Accept</Typo>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(item.id!)}>
                <Typo color={colors.error} fontWeight="600">Reject</Typo>
              </TouchableOpacity>
            </>
          )}
          {item.status && (
               <Typo size={14} color={statusColor}>
               Status: {item.status}
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
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  flatListContent: {
    paddingBottom: verticalScale(100),
  },
  requestItemContainer: {
    flexDirection: 'column',
    backgroundColor: colors.neutral800,
    borderRadius: 8,
    padding: spacingX._10,
    marginBottom: spacingY._10,
  },
  requestContent: {
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacingY._5,
  },
  acceptButton: {
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._8,
    borderRadius: 8,
    marginRight: spacingX._8,
  },
  rejectButton: {
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._8,
    borderRadius: 8,
    backgroundColor: colors.errorLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: spacingY._10,
    width: scale(100),  // Explicit width
    height: verticalScale(100), // Explicit height
  },
  imagePreview: {
    width: '100%',    // Take up the full container width
    height: '100%',   // Take up the full container height
    borderRadius: 8,
  },
});

export default AdRequestsModal;