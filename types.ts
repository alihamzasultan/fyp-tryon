import { Href } from "expo-router";
import { Firestore, Timestamp } from "firebase/firestore";
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';  // ✅
import React, { ReactNode } from "react";


import {
  ActivityIndicator,
  ActivityIndicatorProps,
  ImageStyle,
  PressableProps,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

export type ScreenWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
};
export type ModalWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
  bg?: string;
};
export type accountOptionType = {
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  routeName?: any;
};

export type TypoProps = {
  size?: number;
  color?: string;
  fontWeight?: TextStyle["fontWeight"];
  children: any | null;
  style?: TextStyle;
  textProps?: TextProps;
};

export type IconComponent = React.ComponentType<{
  height?: number;
  width?: number;
  strokeWidth?: number;
  color?: string;
  fill?: string;
}>;


export type IconProps = {
  name: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
  fill?: string;
};

export type HeaderProps = {
  title?: string;
  style?: ViewStyle;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export type BackButtonProps = {
  style?: ViewStyle;
  iconSize?: number;
};

export type TransactionType = {
  id?: string;
  type: string;
  amount: number;
  category?: string;
  date: Date | Timestamp | string;
  description?: string;
  image?: any;
  uid?: string;
  walletId: string;
};

export type CategoryType = {
  label: string;
  value: string;
  icon: (props: TextProps & { size?: number; color?: string }) => JSX.Element;
  bgColor: string;
};
export type ExpenseCategoriesType = {
  [key: string]: CategoryType;
};

export type TransactionListType = {
  data: TransactionType[];
  title?: string;
  loading?: boolean;
  emptyListMessage?: string;
};

export type TransactionItemProps = {
  item: TransactionType;
  index: number;
  handleClick: Function;
  currencySymbol: string;
};

export interface InputProps extends TextInputProps {
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  inputRef?: React.RefObject<TextInput>;
  //   label?: string;
  //   error?: string;
}

export interface CustomButtonProps extends TouchableOpacityProps {
  style?: ViewStyle;
  onPress?: () => void;
  loading?: boolean;
  children: React.ReactNode;
}

export type ImageUploadProps = {
  file?: any;
  onSelect: (file: any) => void;
  onClear: () => void;
  containerStyle?: ViewStyle;
  imageStyle?: ViewStyle;
  placeholder?: string;
};

export type UserType = {
  uid?: string;
  email?: string | null;
  name: string | null;
  image?: any;
  phone?: string;
  address?: string; 
  isBuyer?: boolean;
  store?: StoreType; 
} | null;

export type UserDataType = {
  name: string;
  image?: any;
  phone: string;
  address?: string;
};
export interface StoreType {
  id?: string;
  name: string;
  location: string;
  description?: string;
  logo?: string;
  banner?: string;
  ownerId?: string;
};

export type AuthContextType = {
  user: UserType;
  setUser: Function;
  loading: boolean; 
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; msg?: string }>;
  register: (
    email: string,
    password: string,
    name: string,
    isBuyer: boolean,
    phone?: string  // Add optional phone for registration
  ) => Promise<{ success: boolean; msg?: string }>;
  updateUserData: (userId: string) => Promise<void>;
};
export type ResponseType = {
  success: boolean;
  data?: any;
  msg?: string;
};

export type WalletType = {
  id?: string;
  name: string;
  amount?: number;
  totalIncome?: number;
  totalExpenses?: number;
  image: any;
  uid?: string;
  created?: Date;
};
export interface AdType {
  id?: string
  uid: string
  title: string
  price: number
  images: string[]
  description?: string
  createdAt?: any
  ownerId: string; 
 
}

export interface RequestType {
  id?: string;
  senderUid: string;
  receiverUid: string;
  adId: string;
  message: string;
  imageUri?: string | null;
  timestamp?: any; // Use appropriate type for timestamp
  status?: 'pending' | 'accepted' | 'rejected'; // Add status field
  senderName?: string;
  description?: string;
  price?: string;
  acceptedPrice?: string;
  acceptedDetails?: string;
  acceptedAt?: string;
  rejectedReason?: string;
  rejectedAt?: string;
}

export interface Participant {
  id: string;
  name: string;
  image: string | null;
  isBuyer: boolean;
}

export interface AdInfo {
  id: string;
  title: string;
  price: number;
  images: string[];
}

export interface LastMessage {
  text: string;
  senderId: string;
  createdAt: any;   // Firestore Timestamp
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;   // Firestore Timestamp
}

export interface ChatRoom {
  id: string;
  senderId: string;
  receiverId: string;
  adId: string;
  createdAt: any;   // Firestore Timestamp
  lastMessage?: string;
  lastMessageTime?: any;   // Firestore Timestamp
}
export interface ChatItem {
  id: string;
  senderId: string;
  receiverId: string;
  adId: string;
  lastMessage?: string;
  lastMessageTime?: any;
}
