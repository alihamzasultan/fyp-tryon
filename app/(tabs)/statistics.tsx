import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import { scale, verticalScale } from '@/utils/styling';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import Header from '@/components/Header';
import Typo from '@/components/Typo';
import { useAuth } from '@/contexts/authContext';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, doc, deleteDoc, getCountFromServer, addDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { AdType, RequestType } from '@/types';
import BackButton from '@/components/BackButton';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AcceptOfferModal from '../(modals)/acceptofferModal';

const FILTERS = ['pending', 'accepted', 'rejected'];

const Statistics = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState<AdType[]>([]);
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requestCounts, setRequestCounts] = useState<{ [adId: string]: number }>({});
  const [activeFilter, setActiveFilter] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestType | null>(null);


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
          where('status', '==', 'pending')
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
  const handleAcceptRequest = async (price: string, details: string) => {
    if (!selectedRequest) return;
    
    try {
      setLoading(true);
      
      // Update the request in Firestore
      await updateDoc(doc(firestore, 'requests', selectedRequest.id!), {
        status: 'accepted',
        acceptedPrice: price,
        acceptedDetails: details,
        acceptedAt: new Date().toISOString(),
      });
      
      // Refresh the data
      if (user?.isBuyer) {
        await fetchSentRequests();
      } else {
        await fetchUserAds();
      }
      
      Alert.alert('Success', 'Offer accepted successfully');
    } catch (error) {
      console.error('Error accepting offer:', error);
      Alert.alert('Error', 'Failed to accept offer');
    } finally {
      setLoading(false);
      setAcceptModalVisible(false);
      setSelectedRequest(null);
    }
  };
  const handleAcceptPress = (request: RequestType) => {
    setSelectedRequest(request);
    setAcceptModalVisible(true);
  };

  const fetchSentRequests = async (isRefresh = false) => {
    if (!user?.uid) return;
    
    try {
      if (!isRefresh) setLoading(true);
      
      // 1. First get all requests (including accepted/rejected)
      const requestsQuery = query(
        collection(firestore, 'requests'),
        where('senderUid', '==', user.uid)
      );
      const requestsSnapshot = await getDocs(requestsQuery);
  
      // 2. Get all responses
      const responsesQuery = query(
        collection(firestore, 'responses'),
        where('senderUid', '==', user.uid)
      );
      const responsesSnapshot = await getDocs(responsesQuery);
  
      // Create a map of requestId to response for easy lookup
      const responseMap = new Map();
      responsesSnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.requestId) {
          responseMap.set(data.requestId, data);
        }
      });
  
      // Merge the data
      const mergedRequests = requestsSnapshot.docs.map(docSnap => {
        const requestData = docSnap.data() as RequestType;
        const responseData = responseMap.get(docSnap.id);
        
        return {
          id: docSnap.id,
          ...requestData,
          // If there's a response, merge its data but keep the original image
          ...(responseData ? {
            status: 'accepted',
            acceptedPrice: responseData.price,
            acceptedDetails: responseData.description,
            acceptedAt: responseData.timestamp,
            // Preserve the original imageUri if it exists
            imageUri: requestData.imageUri || responseData.imageUri || null
          } : {})
        } as RequestType;
      });
  
      setRequests(mergedRequests);
    } catch (error) {
      console.error('Error fetching sent requests:', error);
      Alert.alert('Error', 'Failed to load your requests');
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      // Fetch data when screen comes into focus
      if (user?.uid) {
        if (user.isBuyer) {
          fetchSentRequests();
        } else {
          fetchUserAds();
        }
      }
    }, [user?.uid, user?.isBuyer])
  );
  useEffect(() => {
    // Initial data fetch
    if (user?.uid) {
      if (user.isBuyer) {
        fetchSentRequests();
      } else {
        fetchUserAds();
      }
    }
  }, [user?.uid, user?.isBuyer]);

  const onRefresh = useCallback(() => {
    if (user?.isBuyer) {
      fetchSentRequests(true);
    } else {
      fetchUserAds(true);
    }
  }, [user?.isBuyer]);

  const handleEdit = (adId: string) => {
    router.push({ pathname: '/(modals)/addModal', params: { adId } });
  };

  const handleRejectRequest = async (requestId: string) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this request?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Update the request status in Firestore
              await updateDoc(doc(firestore, 'requests', requestId), {
                status: 'rejected',
                rejectedAt: new Date().toISOString(),
              });
              
              // Refresh the data
              if (user?.isBuyer) {
                await fetchSentRequests();
              } else {
                await fetchUserAds();
              }
              
              Alert.alert('Success', 'Request rejected successfully');
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', 'Failed to reject request');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
            />
          </View>
        )}
        <View style={styles.requestContent}>
          <Typo size={16} fontWeight="600" color={colors.neutral800}>
            {item.message || 'No message provided'}
          </Typo>
          
          <View style={styles.statusContainer}>
            <Typo size={14} color={statusColor}>
              Status: {item.status ?? 'pending'}
            </Typo>
          </View>
          
          {item.status === 'accepted' && (
            <View style={styles.acceptedDetailsContainer}>
              <View style={styles.detailRow}>
                <Ionicons name="pricetag" size={16} color={colors.neutral600} />
                <Typo size={14} color={colors.neutral600} style={styles.detailText}>
                  {item.acceptedPrice ? `PKR ${item.acceptedPrice}` : 'Price not specified'}
                </Typo>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="document-text" size={16} color={colors.neutral600} />
                <Typo size={14} color={colors.neutral600} style={styles.detailText}>
                  {item.acceptedDetails || 'No additional details provided'}
                </Typo>
              </View>
              
              {item.acceptedAt && (
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={16} color={colors.neutral600} />
                  <Typo size={12} color={colors.neutral500}>
                    Accepted on: {new Date(item.acceptedAt).toLocaleDateString()}
                  </Typo>
                </View>
              )}
            </View>
          )}
          
          {item.status === 'rejected' && item.rejectedAt && (
            <View style={styles.detailRow}>
              <Ionicons name="time" size={16} color={colors.neutral600} />
              <Typo size={12} color={colors.neutral500}>
                Rejected on: {new Date(item.rejectedAt).toLocaleDateString()}
              </Typo>
            </View>
          )}
        </View>
        
        {!user?.isBuyer && item.status === 'pending' && (
          <View style={styles.requestActions}>
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => handleAcceptPress(item)}
            >
              <Typo color={colors.white}>Accept</Typo>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.rejectButton}
              onPress={() => handleRejectRequest(item.id!)}
            >
              <Typo color={colors.white}>Reject</Typo>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  const filteredRequests = requests.filter(req => (req.status ?? 'pending') === activeFilter);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header
          title={user?.isBuyer ? "My Orders" : "My Ads"}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />
        
        {user?.isBuyer ? (
          <>
            <Typo size={14} color={colors.neutral600} style={{ marginBottom: spacingY._10 }}>
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
                    color={activeFilter === filter ? colors.white : colors.neutral600}
                    fontWeight="500"
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Typo>
                </TouchableOpacity>
              ))}
            </View>

            {loading && !refreshing ? (
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
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                  />
                }
              />
            )}
          </>
        ) : (
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
        )}
      </View>

            
      <AcceptOfferModal
        visible={acceptModalVisible}
        onClose={() => setAcceptModalVisible(false)}
        onAccept={handleAcceptRequest}
      />
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
  requestContent: {
    flex: 1,
    gap: spacingY._10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
  },
  acceptedDetailsContainer: {
    marginTop: spacingY._10,
    gap: spacingY._10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
  },
  detailText: {
    flex: 1,
  },
  
  // Update these styles for better spacing
  requestItemContainer: {
    backgroundColor: colors.neutral50,
    borderRadius: radius._12,
    padding: spacingX._12,
    marginBottom: spacingY._10,
    flexDirection: 'row',
    gap: spacingX._10,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacingX._8,
    marginTop: spacingY._8,
    alignSelf: 'flex-end',
  },

  acceptButton: {
    backgroundColor: colors.green,
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._10,
    borderRadius: radius._6,
  },
  rejectButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._10,
    borderRadius: radius._6,
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

  imagePreviewContainer: {
    width: 60,
    height: 60,
    borderRadius: radius._8,
    overflow: 'hidden',
  },
  imagePreview: { 
    width: '100%', 
    height: '100%' 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});