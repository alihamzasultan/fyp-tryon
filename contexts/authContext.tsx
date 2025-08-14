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

const AuthContext = createContext<AuthContextType | null>(null);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await firebaseUser.reload(); // refresh user data
  
        if (!firebaseUser.emailVerified) {
          // If not verified, keep them in login/verification flow
          router.replace("/(auth)/login");
          return;
        }
  
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName
        });
  
        updateUserData(firebaseUser.uid);
        router.replace("/(tabs)/"); 
      } else {
        setUser(null);
        router.replace("/(auth)/welcome");
      }
    });
  
    return () => unsub();
  }, []);
  
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
      // 🔄 Force refresh user data to get updated emailVerified status
      await userCredential.user.reload();
  
      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user);
        await auth.signOut();
        return {
          success: false,
          msg: "We re-sent a verification email. Please check your inbox."
        };
      }
  
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("(auth/invalid-credential)")) msg = "Wrong credentials";
      if (msg.includes("(auth/invalid-email)")) msg = "Invalid email";
      return { success: false, msg };
    }
  };
  
  
  
  
  type RegisterResponse = {
    success: boolean;
    user?: User;  // now TypeScript knows user can exist
    msg?: string;
  };

  const register = async (
    email: string,
    password: string,
    name: string
  ): Promise<RegisterResponse> => {
    try {
      console.log("📧 Starting registration process...");
      const response = await createUserWithEmailAndPassword(auth, email, password);
      console.log("✅ User created in Firebase Auth:", response.user.uid);
  
      console.log("🔄 Reloading current user to ensure it's ready...");
      await auth.currentUser?.reload();
      console.log("🔍 Current user after reload:", auth.currentUser);
  
      if (!auth.currentUser) {
        console.error("❌ No currentUser found after reload — email will NOT be sent");
      } else {
        console.log("📤 Sending verification email to:", auth.currentUser.email);
        await sendEmailVerification(auth.currentUser);
        console.log("✅ Verification email request sent (check spam/junk folder too).");
      }
  
      console.log("📝 Storing user in Firestore...");
      await setDoc(doc(firestore, "users", response.user.uid), {
        name,
        email,
        uid: response.user.uid,
      });
      console.log("✅ User stored in Firestore");
  
      return { success: true, user: response.user };
    } catch (error: any) {
      console.error("🔥 Error during registration:", error);
      let msg = error.message;
      if (msg.includes("(auth/email-already-in-use)"))
        msg = "This email is already registered";
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
        const userData: UserType = {
          uid: data?.uid,
          email: data.email || null,
          name: data.name || null,
          image: data.image || null,
          phone: data.phone || null,
        };
        setUser({ ...userData });
      }
      // return { success: true };
    } catch (error: any) {
      let msg = error.message;
      // return { success: false, msg };
      console.log('error', error);
    }

  };

  const contextValue: AuthContextType = {
    user, setUser,
    login,
    register,
    updateUserData
  }
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );





};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be wrapped inside AuthProvider")
  }
  return context;
}
