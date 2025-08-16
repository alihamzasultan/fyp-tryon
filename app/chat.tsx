import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/authContext';
import { colors } from '@/constants/theme';
import Typo from '@/components/Typo';
import ChatModal from './(modals)/chatModal';

const ChatScreen = () => {
  const { roomId, adId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !adId) {
      console.log('❌ Missing roomId or adId');
      router.back();
      return;
    }

    // Extract seller ID from roomId
    // Room ID format: chat_{senderId}_{receiverId}_ad_{adId}
    const roomIdStr = roomId as string;
    const parts = roomIdStr.split('_');
    
    if (parts.length >= 4) {
      const senderId = parts[1];
      const receiverId = parts[2];
      
      // Determine which one is the seller (not the current user)
      const currentUserId = user?.uid;
      const otherUserId = senderId === currentUserId ? receiverId : senderId;
      
      setSellerId(otherUserId);
      setLoading(false);
    } else {
      // Handle case where roomId is not in the expected format
      // For test rooms, we can use a fallback approach
      console.log('⚠️ Room ID format not as expected, using fallback:', roomIdStr);
      
      // For test rooms, we'll use the adId to determine the seller
      if (adId === 'test_ad_id') {
        setSellerId('test_receiver_id');
      } else if (adId === 'test_ad_id_2') {
        setSellerId('test_sender_id');
      } else {
        // Try to extract from the roomId if it contains user IDs
        const currentUserId = user?.uid;
        if (roomIdStr.includes(currentUserId || '')) {
          // Find the other user ID in the roomId
          const otherUserId = roomIdStr.replace(currentUserId || '', '').replace(/[^a-zA-Z0-9]/g, '');
          if (otherUserId && otherUserId !== currentUserId) {
            setSellerId(otherUserId);
          } else {
            setSellerId('unknown_user');
          }
        } else {
          setSellerId('unknown_user');
        }
      }
      setLoading(false);
    }
  }, [roomId, adId, user?.uid]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Typo style={{ marginTop: 16 }}>Loading chat...</Typo>
      </View>
    );
  }

  if (!sellerId) {
    return (
      <View style={styles.errorContainer}>
        <Typo>Error: Could not load chat</Typo>
      </View>
    );
  }

  return (
    <ChatModal
      visible={true}
      onClose={() => router.back()}
      sellerId={sellerId}
      adId={adId as string}
      isFullScreen={true}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral900,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral900,
  },
});

export default ChatScreen;
