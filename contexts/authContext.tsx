import { auth, firestore } from "@/config/firebase";
import { AuthContextType, UserType } from "@/types";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType>(null);
  const [loading, setLoading] = useState(true); // <-- new
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true); // start loading

      if (firebaseUser) {
        await firebaseUser.reload();

        if (!firebaseUser.emailVerified) {
          router.replace("/(auth)/login");
          setLoading(false);
          return;
        }

        // Wait for Firestore user data before navigating
        await updateUserData(firebaseUser.uid);
        await registerForPushNotificationsAsync(firebaseUser.uid);

        setLoading(false); // done loading
        router.replace("/(tabs)/");
      } else {
        setUser(null);
        setLoading(false);
        router.replace("/(auth)/welcome");
      }
    });

    return () => unsub();
  }, []);

  // 🔔 Push notification listeners
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log("📩 Notification received:", notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("🔗 User tapped notification:", response);
      const adId = response.notification.request.content.data?.adId;
      if (adId) {
        router.push(`/ads/${adId}`);
      }
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  // 📱 Register for notifications
  async function registerForPushNotificationsAsync(uid: string) {
    if (!Device.isDevice) {
      alert('Push notifications require a physical device');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Permission for notifications not granted');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo push token:", token);

    await setDoc(doc(firestore, "users", uid), { expoPushToken: token }, { merge: true });
  }

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await userCredential.user.reload();

      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user);
        await auth.signOut();
        return { success: false, msg: "We re-sent a verification email. Please check your inbox." };
      }

      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("(auth/invalid-credential)")) msg = "Wrong credentials";
      if (msg.includes("(auth/invalid-email)")) msg = "Invalid email";
      return { success: false, msg };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      await auth.currentUser?.reload();
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }

      await setDoc(doc(firestore, "users", response.user.uid), { name, email, uid: response.user.uid });
      return { success: true, user: response.user };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("(auth/email-already-in-use)")) msg = "This email is already registered";
      if (msg.includes("(auth/invalid-email)")) msg = "Invalid email";
      return { success: false, msg };
    }
  };

  const updateUserData = async (uid: string) => {
    try {
      const docRef = doc(firestore, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser({
          uid: data?.uid,
          email: data.email || null,
          name: data.name || null,
          image: data.image || null,
          phone: data.phone || null,
          address: data.address || '',
        });
      }
    } catch (error: any) {
      console.log('error', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, updateUserData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be wrapped inside AuthProvider");
  }
  return context;
};
