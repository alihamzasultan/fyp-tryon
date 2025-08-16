import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import Typo from '@/components/Typo';
import ModalWrapper from '@/components/ModalWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { scale, verticalScale } from '@/utils/styling';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { firestore } from '@/config/firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, addDoc } from 'firebase/firestore';
import { RequestType } from '@/types';
import { Image } from 'expo-image';
import Button from '@/components/Button';

const AdRequestsModal = () => {
  const router = useRouter();
  const { adId } = useLocalSearchParams<{ adId?: string }>();
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<RequestType | null>(null);
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

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
              senderName,
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

  const handleAcceptPress = (request: RequestType) => {
    setCurrentRequest(request);
    setAcceptModalVisible(true);
  };

  const handleRejectPress = async (requestId: string) => {
    try {
      const requestDocRef = doc(firestore, 'requests', requestId);
      await updateDoc(requestDocRef, { 
        status: 'rejected', 
        seen: true 
      });

      setRequests(prev =>
        prev.map(req => req.id === requestId ? { ...req, status: 'rejected', seen: true } : req)
      );
      Alert.alert('Success', 'Request rejected.');
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject request.');
    }
  };

  const handleAcceptSubmit = async () => {
    if (!currentRequest || !price) {
      Alert.alert('Error', 'Please enter a price');
      return;
    }
  
    try {
      // Update the request status
      const requestDocRef = doc(firestore, 'requests', currentRequest.id!);
      await updateDoc(requestDocRef, { 
        status: 'accepted', 
        seen: true 
      });
  
      // Create a response document with the image URL
      await addDoc(collection(firestore, 'responses'), {
        adId: currentRequest.adId,
        requestId: currentRequest.id,
        senderUid: currentRequest.senderUid,
        receiverUid: currentRequest.receiverUid,
        price,
        description,
        imageUri: currentRequest.imageUri || null, // Add this line
        timestamp: new Date(),
        status: 'accepted'
      });
  
      // Update local state
      setRequests(prev =>
        prev.map(req => req.id === currentRequest.id ? { 
          ...req, 
          status: 'accepted', 
          seen: true 
        } : req)
      );
  
      setAcceptModalVisible(false);
      setPrice('');
      setDescription('');
      Alert.alert('Success', 'Request accepted and response sent.');
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request.');
    }
  };

  const renderRequestItem = ({ item }: { item: RequestType }) => {
    const status = item.status ?? 'pending';
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
              <TouchableOpacity 
                style={styles.acceptButton} 
                onPress={() => handleAcceptPress(item)}
              >
                <Typo color={colors.green} fontWeight="600">Accept</Typo>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rejectButton} 
                onPress={() => handleRejectPress(item.id!)}
              >
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
        
        {/* Accept Request Modal */}
        <Modal
          visible={acceptModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAcceptModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Typo size={18} fontWeight="600" style={styles.modalTitle}>
                Accept Request
              </Typo>
              
              <Typo size={14} color={colors.neutral300} style={styles.modalLabel}>
                Price
              </Typo>
              <TextInput
                style={styles.input}
                placeholder="Enter price"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholderTextColor={colors.neutral400}
              />
              
              <Typo size={14} color={colors.neutral300} style={styles.modalLabel}>
                Description (Optional)
              </Typo>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Enter any additional details"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.neutral400}
              />
              
              <View style={styles.modalButtons}>
                <Button
                 
                  onPress={() => setAcceptModalVisible(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleAcceptSubmit}
                  style={styles.modalButton}
                >
                  Submit
                </Button>
              </View>
            </View>
          </View>
        </Modal>
        
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
  requestActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    gap: spacingX._8 
  },
  acceptButton: { 
    paddingHorizontal: spacingX._12, 
    paddingVertical: spacingY._8, 
    borderRadius: 8, 
    backgroundColor: colors.neutral700 
  },
  rejectButton: { 
    paddingHorizontal: spacingX._12, 
    paddingVertical: spacingY._8, 
    borderRadius: 8, 
    backgroundColor: colors.errorLight 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingX._20,
    width: '90%',
  },
  modalTitle: {
    marginBottom: spacingY._20,
    textAlign: 'center',
  },
  modalLabel: {
    marginBottom: spacingY._8,
  },
  input: {
    backgroundColor: colors.neutral700,
    borderRadius: 8,
    padding: spacingX._12,
    marginBottom: spacingY._10,
    color: colors.neutral50,
  },
  multilineInput: {
    height: verticalScale(100),
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacingY._12,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: spacingX._10,
  },
});

export default AdRequestsModal;