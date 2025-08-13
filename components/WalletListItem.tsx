import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { WalletType } from "@/types";
import { Router } from 'expo-router';
import { verticalScale } from '@/utils/styling';
import { colors, radius, spacingX } from '@/constants/theme';
import { Image } from 'expo-image';
import Typo from './Typo';
import { Feather } from '@expo/vector-icons'; // ✅ or use another set like Ionicons/MaterialIcons
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
    item: WalletType;
    index: number;
    router: Router;
}

const WalletListItem = ({ item, index, router }: Props) => {
    const [currencySymbol, setCurrencySymbol] = useState('$'); // default fallback

    useEffect(() => {
        const loadCurrencySymbol = async () => {
            try {
                const storedSymbol = await AsyncStorage.getItem('selectedCurrencySymbol');
                if (storedSymbol) {
                    setCurrencySymbol(storedSymbol);
                }
            } catch (e) {
                console.log("Error loading currency symbol:", e);
            }
        };
        loadCurrencySymbol();
    }, []);

    const openWallet = () => {
        router.push({
            pathname: "/(modals)/walletModal",
            params: {
                id: item?.id,
                name: item?.name,
                image: item?.image,
            },
        });
    };

    return (
        <Animated.View entering={FadeInDown.delay(index * 100).springify().damping(13)}>
            <TouchableOpacity style={styles.container} onPress={openWallet}>
                <View style={styles.imageContainer}>
                    <Image
                        style={{ flex: 1 }}
                        source={item?.image}
                        contentFit="cover"
                        transition={100}
                    />
                </View>

                <View style={styles.nameContainer}>
                    <Typo size={16}>{item?.name}</Typo>
                    <Typo size={14} color={colors.neutral400}>
                        {currencySymbol} {item?.amount}
                    </Typo>
                </View>

                <Feather name="chevron-right" size={verticalScale(20)} color={colors.white} />
            </TouchableOpacity>
        </Animated.View>
    );
};

export default WalletListItem;

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: verticalScale(17),
    },
    imageContainer: {
        height: verticalScale(45),
        width: verticalScale(45),
        borderWidth: 1,
        borderColor: colors.neutral600,
        borderRadius: radius._12,
        borderCurve: "continuous",
        overflow: "hidden",
    },
    nameContainer: {
        flex: 1,
        gap: 2,
        marginLeft: spacingX._10,
    },
});
