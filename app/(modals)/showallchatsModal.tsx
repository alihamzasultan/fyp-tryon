import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import Typo from '@/components/Typo';
import { useAuth } from '@/contexts/authContext';
import { firestore } from '@/config/firebase';
import { collection, query, where, onSnapshot, orderBy, getDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { ChatItem } from '@/types';

const ShowAllChatsModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { user } = useAuth();
  console.log("🔍 ShowAllChatsModal rendered:", { visible, userUid: user?.uid });
  
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔍 useEffect triggered:", { visible, userUid: user?.uid });
    
    if (!visible || !user?.uid) {
      console.log("🔍 useEffect early return:", { visible, userUid: user?.uid });
      setLoading(false);
      setChatRooms([]);
      return;
    }
  
    console.log("🔍 Starting to load chat rooms for user:", user.uid);
    setLoading(true);
  
    // Query for chats where user is the sender
    const q1 = query(
      collection(firestore, 'chatRooms'),
      where('senderId', '==', user.uid)
    );

    // Query for chats where user is the receiver
    const q2 = query(
      collection(firestore, 'chatRooms'),
      where('receiverId', '==', user.uid)
    );
  
    let unsubscribe1: (() => void) | undefined;
    let unsubscribe2: (() => void) | undefined;
    let senderRooms: ChatItem[] = [];
    let receiverRooms: ChatItem[] = [];

    const updateChatRooms = () => {
      const allRooms = [...senderRooms, ...receiverRooms];
      // Sort by last message time (most recent first)
      allRooms.sort((a, b) => {
        if (!a.lastMessageTime || !b.lastMessageTime) return 0;
        return b.lastMessageTime.toDate() - a.lastMessageTime.toDate();
      });

      console.log("🔥 ChatRooms fetched:", allRooms);
      console.log("🔥 Sender rooms:", senderRooms.length);
      console.log("🔥 Receiver rooms:", receiverRooms.length);
      setChatRooms(allRooms);
      setLoading(false);
    };

    unsubscribe1 = onSnapshot(q1, (snapshot) => {
      console.log("🔥 Sender query result:", snapshot.docs.length, "documents");
      senderRooms = snapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("🔥 Sender room data:", data);
        return {
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          adId: data.adId,
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime,
        } as ChatItem;
      });
      updateChatRooms();
    }, (error) => {
      console.error("❌ Error loading sender chats:", error);
      setLoading(false);
    });

    unsubscribe2 = onSnapshot(q2, (snapshot) => {
      console.log("🔥 Receiver query result:", snapshot.docs.length, "documents");
      receiverRooms = snapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("🔥 Receiver room data:", data);
        return {
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          adId: data.adId,
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime,
        } as ChatItem;
      });
      updateChatRooms();
    }, (error) => {
      console.error("❌ Error loading receiver chats:", error);
      setLoading(false);
    });
  
    return () => {
      if (unsubscribe1) unsubscribe1();
      if (unsubscribe2) unsubscribe2();
    };
  }, [visible, user?.uid]);
  
  const getOtherParticipantName = async (room: ChatItem) => {
    if (!user?.uid) return 'Unknown User';
    const otherUserId = room.senderId === user.uid ? room.receiverId : room.senderId;
    
    try {
      const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
      const userData = userDoc.data();
      return userData?.name || 'Unknown User';
    } catch (error) {
      console.error('Error fetching user name:', error);
      return 'Unknown User';
    }
  };

  // Test function to create a sample chat room
  const createTestChatRoom = async () => {
    if (!user?.uid) return;
    
    try {
      const testRoomData = {
        senderId: user.uid,
        receiverId: 'test_receiver_id',
        adId: 'test_ad_id',
        createdAt: serverTimestamp(),
        lastMessage: 'Hello! This is a test message.',
        lastMessageTime: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(firestore, 'chatRooms'), testRoomData);
      console.log('✅ Test chat room created with ID:', docRef.id);
      console.log('✅ Created with senderId:', user.uid);
    } catch (error) {
      console.error('❌ Error creating test chat room:', error);
    }
  };

  // Test function to create a chat room where current user is the receiver
  const createTestChatRoomAsReceiver = async () => {
    if (!user?.uid) return;
    
    try {
      const testRoomData = {
        senderId: 'test_sender_id',
        receiverId: user.uid,
        adId: 'test_ad_id_2',
        createdAt: serverTimestamp(),
        lastMessage: 'Hello! You received this message.',
        lastMessageTime: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(firestore, 'chatRooms'), testRoomData);
      console.log('✅ Test receiver chat room created with ID:', docRef.id);
      console.log('✅ Created with receiverId:', user.uid);
    } catch (error) {
      console.error('❌ Error creating test receiver chat room:', error);
    }
  };

  // Debug function to check current user state
  const debugUserState = () => {
    console.log('🔍 Current user state:', {
      uid: user?.uid,
      name: user?.name,
      email: user?.email,
      isBuyer: user?.isBuyer
    });
  };

  const renderChatItem = ({ item }: { item: ChatItem }) => {
    const isCurrentUserSender = item.senderId === user?.uid;
    const otherUserId = item.senderId === user?.uid ? item.receiverId : item.senderId;
    
    // For now, show a simple display name
    const displayName = otherUserId === 'test_receiver_id' ? 'Test User' : 
                       otherUserId === 'test_sender_id' ? 'Test Sender' :
                       otherUserId === 'cZgSXSUhqfTOTqP5eZR6XwMcrss2' ? 'Another User' :
                       otherUserId;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          console.log("➡️ Opening chat:", item.id, "adId:", item.adId);
          onClose();
          // Navigate to chat screen with room ID and ad ID
          router.push({
            pathname: '/chat',
            params: { roomId: item.id, adId: item.adId }
          });
        }}
      >
        <View style={[styles.userImage, styles.emptyUserImage]}>
          <Ionicons name="person" size={24} color={colors.neutral500} />
        </View>

        <View style={styles.chatContent}>
          <Text style={{ color: colors.white, fontWeight: 'bold' }}>
            {displayName}
          </Text>
          <Text style={{ color: colors.neutral400 }}>
            {isCurrentUserSender ? 'You: ' : ''}{item.lastMessage || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>

          <Text style={styles.headerTitle}>Chats ({chatRooms.length})</Text>
        </View>
  
        <View style={styles.container}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
                     ) : chatRooms.length === 0 ? (
             <View style={styles.emptyContainer}>
               <Ionicons name="chatbubble-outline" size={48} color={colors.neutral500} />
               <Text style={styles.noChatsText}>No chats found</Text>
               <Text style={[styles.noChatsText, { fontSize: 12, marginTop: 8 }]}>
                 User ID: {user?.uid}
               </Text>
                               <TouchableOpacity 
                  style={styles.testButton} 
                  onPress={createTestChatRoom}
                >
                  <Text style={styles.testButtonText}>Create Test Chat Room (as Sender)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.testButton, { marginTop: spacingY._10 }]} 
                  onPress={createTestChatRoomAsReceiver}
                >
                  <Text style={styles.testButtonText}>Create Test Chat Room (as Receiver)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.testButton, { marginTop: spacingY._10, backgroundColor: colors.neutral700 }]} 
                  onPress={debugUserState}
                >
                  <Text style={styles.testButtonText}>Debug User State</Text>
                </TouchableOpacity>
             </View>
          ) : (
            <FlatList
              data={chatRooms}
              renderItem={renderChatItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
  
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.neutral900 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacingY._12,
      paddingHorizontal: spacingX._15,
      borderBottomWidth: 1,
      borderBottomColor: colors.neutral800,
    },
    backButton: {
      marginRight: spacingX._10,
      padding: 4,
    },
    headerTitle: {
      color: colors.white,
      fontSize: 18,
      fontWeight: 'bold',
    },
    container: { flex: 1, paddingHorizontal: spacingX._15 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    noChatsText: { marginTop: 16, color: colors.white, fontSize: 16 },
    listContent: { paddingBottom: spacingY._20 },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacingY._12,
      paddingHorizontal: spacingX._10,
      backgroundColor: colors.neutral800,
      borderRadius: radius._10,
      marginBottom: spacingY._10,
    },
         userImage: { width: 50, height: 50, borderRadius: 25, marginRight: spacingX._10 },
     emptyUserImage: { backgroundColor: colors.neutral700, justifyContent: 'center', alignItems: 'center' },
     chatContent: { flex: 1 },
     testButton: {
       backgroundColor: colors.primary,
       paddingHorizontal: spacingX._20,
       paddingVertical: spacingY._10,
       borderRadius: radius._10,
       marginTop: spacingY._20,
     },
     testButtonText: {
       color: colors.white,
       fontSize: 14,
       fontWeight: 'bold',
       textAlign: 'center',
     },
   });
  
export default ShowAllChatsModal;
