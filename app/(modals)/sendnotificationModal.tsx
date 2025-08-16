// SendRequestModal.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typo from '@/components/Typo';
import ModalWrapper from '@/components/ModalWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { scale, verticalScale } from '@/utils/styling';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useFetchData from '@/hooks/useFetchData';
import { AdType } from '@/types';
import { Image } from 'expo-image';  // Import expo-image
import { auth, firestore } from '@/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendPushNotification } from '@/services/notifications';
import { doc, getDoc } from "firebase/firestore";
const SendRequestModal = () => {
  const router = useRouter();
  const { shirtImageUri } = useLocalSearchParams<{ shirtImageUri?: string }>(); // Get the shirt image URI
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAds, setSelectedAds] = useState<string[]>([]);
  const [allAds, setAllAds] = useState<AdType[]>([]);
  const [requestMessage, setRequestMessage] = useState(''); // Add message state
  const [adRequests, setAdRequests] = useState<{[key: string]: boolean}>({}); // Mock the requests, in real case do it on the backend

  const {
    data: fetchedAds,
    loading: adsLoading,
    error: adsError,
  } = useFetchData<AdType>('ads', []);

  useEffect(() => {
    if (fetchedAds) {
      setAllAds(fetchedAds);
    }
  }, [fetchedAds]);

  useEffect(() => {
    console.log("Shirt Image URI:", shirtImageUri);
  }, [shirtImageUri]);


  const filteredAds = allAds.filter(ad =>
    (ad.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ad.description?.toLowerCase().includes(searchQuery.toLowerCase())) ?? false
  );

  const toggleAdSelection = (adId: string | undefined) => {
    if (!adId) return;
   
    setSelectedAds(prev =>
      prev.includes(adId)
        ? prev.filter(id => id !== adId)
        : [...prev, adId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAds.length === filteredAds.length) {
      setSelectedAds([]);
    } else {
      setSelectedAds(filteredAds.map(ad => ad.id).filter((id): id is string => !!id));
    }
  };

  const handleSendRequest = async () => {
    if (selectedAds.length === 0) {
      Alert.alert('Error', 'Please select at least one ad.');
      return;
    }
  
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to send a request.');
      return;
    }
  
    try {
      const senderUid = auth.currentUser.uid;
  
      for (const adId of selectedAds) {
        const ad = allAds.find(a => a.id === adId);
        if (!ad) continue;
  
        const receiverUid = ad.uid || null;
  
        // Save request in Firestore with status 'pending'
        await addDoc(collection(firestore, 'requests'), {
          senderUid,
          receiverUid,
          adId,
          message: requestMessage,
          imageUri: shirtImageUri || null,
          timestamp: serverTimestamp(),
          status: 'pending',  // <-- New
        });
  
        // Send push notification
        if (receiverUid) {
          const userDoc = await getDoc(doc(firestore, "users", receiverUid));
          if (userDoc.exists()) {
            const { expoPushToken } = userDoc.data();
            if (expoPushToken) {
              await sendPushNotification(
                expoPushToken,
                "📬 New Request Received",
                `${auth.currentUser?.displayName || "Someone"} sent you a request!`,
                { adId }
              );
            }
          }
        }
  
        // Mark as sent locally
        setAdRequests(prev => ({ ...prev, [adId]: true }));
      }
  
      Alert.alert('Request Sent', 'Your request has been sent successfully!');
      router.back();
  
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('Error', 'Failed to send request. Please try again.');
    }
  };
  

  const renderAdItem = ({ item }: { item: AdType }) => {
    if (!item.id) return null;
   
    const isSelected = selectedAds.includes(item.id);
    const coverImage = item.images?.[0];

    return (
      <TouchableOpacity
        onPress={() => toggleAdSelection(item.id)}
        style={styles.adItemContainer}
      >
        <View style={styles.adImageContainer}>
          {coverImage && (
            <Image
              source={{ uri: coverImage }}
              style={styles.adImage}
              resizeMode="cover"
            />
          )}
        </View>
       
        <View style={styles.adDetails}>
          <Typo size={16} fontWeight="600" >
            {item.title}
          </Typo>
          <Typo size={14} color={colors.neutral400} >
            {item.price ? `PKR ${item.price.toLocaleString()}` : 'Price not listed'}
          </Typo>
        </View>
       
        <View style={styles.selectionIndicator}>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          ) : (
            <View style={styles.unselectedCircle} />
          )}
        </View>
        {adRequests[item.id] && <Ionicons name="notifications" size={20} color={colors.green} />}
      </TouchableOpacity>
    );
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title="Select Ads"
          leftIcon={<BackButton />}
          style={{marginBottom: spacingY._10}}
        />
        {shirtImageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={shirtImageUri}
              style={styles.imagePreview}
              contentFit="contain"
            />
          </View>
        ) : (
          <Typo>No Image Selected</Typo>
        )}

        <TextInput
          style={styles.messageInput}
          placeholder="Write your request message..."
          value={requestMessage}
          onChangeText={setRequestMessage}
          multiline
          placeholderTextColor={colors.neutral400}
        />

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search ads..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.neutral400}
          />
          <Ionicons name="search" size={20} color={colors.neutral400} style={styles.searchIcon} />
        </View>

        <View style={styles.selectAllContainer}>
          <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllButton}>
            <Typo size={14} color={colors.primary}>
              {selectedAds.length === filteredAds.length ? 'Deselect All' : 'Select All'}
            </Typo>
          </TouchableOpacity>
          <Typo size={14} color={colors.neutral400}>
            {selectedAds.length} selected
          </Typo>
        </View>

        {adsLoading ? (
          <View style={styles.loadingContainer}>
            <Typo>Loading ads...</Typo>
          </View>
        ) : filteredAds.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Typo>No ads found</Typo>
          </View>
        ) : (
          <FlatList
            data={filteredAds}
            renderItem={renderAdItem}
            keyExtractor={(item) => item.id ?? Math.random().toString()}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Button
          onPress={handleSendRequest}
          style={{flex:1}}
          disabled={selectedAds.length === 0}
        >
          <Typo color={colors.black} fontWeight={'700'}>
            Confirm ({selectedAds.length})
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingY._20,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: spacingY._10,
  },
  searchInput: {
    backgroundColor: colors.neutral800,
    borderRadius: 8,
    paddingVertical: verticalScale(10),
    paddingLeft: spacingX._40,
    paddingRight: spacingX._20,
    color: colors.white,
  },
  searchIcon: {
    position: 'absolute',
    left: spacingX._10,
    top: verticalScale(10),
  },
  selectAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  selectAllButton: {
    paddingVertical: verticalScale(5),
  },
  flatListContent: {
    paddingBottom: verticalScale(100),
  },
  adItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral800,
    borderRadius: 8,
    padding: spacingX._10,
    marginBottom: spacingY._10,
  },
  adImageContainer: {
    width: verticalScale(60),
    height: verticalScale(60),
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: spacingX._10,
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  adDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedCircle: {
    width: 20,
    height: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral500,
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
    width: scale(150),  // Explicit width
    height: verticalScale(150), // Explicit height
  },
  imagePreview: {
    width: '100%',    // Take up the full container width
    height: '100%',   // Take up the full container height
    borderRadius: 8,
  },
  messageInput: {
    backgroundColor: colors.neutral800,
    borderRadius: 8,
    paddingVertical: verticalScale(10),
    paddingHorizontal: spacingX._20,
    color: colors.white,
    marginBottom: spacingY._10,
    textAlignVertical: 'top', // Allows multiline input from top
    height: verticalScale(100), // Set a fixed height or adjust as needed
  },
});

export default SendRequestModal;