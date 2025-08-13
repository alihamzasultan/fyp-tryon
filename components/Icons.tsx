import React from "react";
import { Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { TextProps } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconComponent = (props: TextProps & { size?: number; color?: string }) => JSX.Element;

export const Icons: Record<string, IconComponent> = {
  ShoppingCart: (props) => <Feather name="shopping-cart" {...props} />,
  House: (props) => <FontAwesome5 name="home" {...props} />,
  Lightbulb: (props) => <Feather name="zap" {...props} />,
  Car: (props) => <Feather name="truck" {...props} />,
  FilmStrip: (props) => <Feather name="film" {...props} />,
  ForkKnife: (props) => <MaterialIcons name="restaurant" {...props} />,
  Heart: (props) => <Feather name="heart" {...props} />,
  ShieldCheck: (props) => <MaterialIcons name="verified-user" {...props} />,
  PiggyBank: (props) => <FontAwesome5 name="piggy-bank" {...props} />,
  TShirt: (props) => <FontAwesome5 name="tshirt" {...props} />,
  User: (props) => <Feather name="user" {...props} />,
  DotsThreeOutline: (props) => <Feather name="more-horizontal" {...props} />,
  CurrencyDollarSimple: (props) => <FontAwesome5 name="coins" {...props} />,
};
