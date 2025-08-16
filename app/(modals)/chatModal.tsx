import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  FlatList, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import Typo from '@/components/Typo';
import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { useAuth } from '@/contexts/authContext';
import { ChatRoom, Message } from '@/types';

interface ChatModalProps {
  visible?: boolean;
  onClose: () => void;
  sellerId: string;
  adId: string;
  isFullScreen?: boolean;
}

const ChatModal: React.FC<ChatModalProps> = ({ visible = true, onClose, sellerId, adId, isFullScreen = false }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState<string>('Seller');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Get or create chat room
  const getChatRoomId = async () => {
    if (!user?.uid) return null;
    
    const ids = [user.uid, sellerId].sort();
    const roomId = `chat_${ids.join('_')}_ad_${adId}`;
    
    const roomRef = doc(firestore, 'chatRooms', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      // Get seller name
      const sellerDoc = await getDoc(doc(firestore, 'users', sellerId));
      const seller = sellerDoc.data();
      setSellerName(seller?.name || 'Seller');

      // Create simple chat room
      const roomData: ChatRoom = {
        id: roomId,
        senderId: user.uid,
        receiverId: sellerId,
        adId,
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTime: serverTimestamp()
      };

      await setDoc(roomRef, roomData);
    } else {
      const roomData = roomSnap.data() as ChatRoom;
      // Get seller name from users collection
      const sellerDoc = await getDoc(doc(firestore, 'users', sellerId));
      const seller = sellerDoc.data();
      setSellerName(seller?.name || 'Seller');
    }
    
    return roomId;
  };

  // Load messages when modal becomes visible
  useEffect(() => {
    if (!visible) return;

    setLoading(true);
    const setupChat = async () => {
      try {
        const roomId = await getChatRoomId();
        if (!roomId) return;
        
        setChatRoomId(roomId);

        const messagesRef = collection(firestore, 'chatRooms', roomId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Message[];
          setMessages(msgs);
          setLoading(false);
          
          // Scroll to bottom after a small delay
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up chat:', error);
        setLoading(false);
      }
    };

    const unsubscribePromise = setupChat();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
      setMessages([]);
      setChatRoomId(null);
      setLoading(true);
    };
  }, [visible, user?.uid, sellerId, adId]);

  const sendMessage = async () => {
    if (!message.trim() || !chatRoomId || !user?.uid) return;
  
    try {
      const messagesRef = collection(firestore, 'chatRooms', chatRoomId, 'messages');
  
      await addDoc(messagesRef, {
        text: message,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
  
      // Update last message in chat room
      const roomRef = doc(firestore, 'chatRooms', chatRoomId);
      await setDoc(
        roomRef,
        {
          lastMessage: message,
          lastMessageTime: serverTimestamp(),
        },
        { merge: true }
      );
      
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === user?.uid;
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        <Typo style={styles.messageText}>{item.text}</Typo>
        <Typo size={10} color={colors.neutral500} style={styles.messageTime}>
          {item.createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typo>
      </View>
    );
  };

  if (!visible) return null;

  const ChatContent = () => (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.neutral900 }]}>
      <View style={styles.modalContainer}>
        <Header
          title={`Chat with ${sellerName}`}
          style={{ marginBottom: spacingY._20 }}
        />
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Typo color={colors.neutral500}>No messages yet. Start the conversation!</Typo>
              </View>
            }
          />
        )}
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message..."
            placeholderTextColor={colors.neutral500}
            multiline
            editable={!loading}
          />
          <TouchableOpacity 
            onPress={sendMessage} 
            style={styles.sendButton}
            disabled={!message.trim() || loading}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={message.trim() ? colors.primary : colors.neutral500} 
            />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );

  if (isFullScreen) {
    return <ChatContent />;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <ChatContent />
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral900,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.neutral900,
    padding: spacingX._15,
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
    padding: spacingX._20,
  },
  messagesList: {
    flexGrow: 1,
    paddingBottom: spacingY._10,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: spacingX._12,
    borderRadius: radius._10,
    marginBottom: spacingY._10,
    borderCurve: 'continuous',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius._12,
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: radius._12,
  },
  buyerMessage: {
    backgroundColor: colors.neutral700,
  },
  sellerMessage: {
    backgroundColor: colors.neutral800,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  senderName: {
    marginBottom: spacingY._10,
  },
  messageText: {
    color: colors.white,
  },
  messageTime: {
    textAlign: 'right',
    marginTop: spacingY._8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacingY._10,
    borderTopWidth: 1,
    borderTopColor: colors.neutral800,
    backgroundColor: colors.neutral900,
  },
  input: {
    flex: 1,
    backgroundColor: colors.neutral800,
    color: colors.white,
    borderRadius: radius._20,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    marginRight: spacingX._10,
    minHeight: 40,
    maxHeight: 100,
  },
  sendButton: {
    padding: spacingX._8,
  },
});

export default ChatModal;