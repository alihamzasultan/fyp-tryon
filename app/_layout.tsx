import { StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/authContext";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

const StackLayout = () => {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="(modals)/profileModal"
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="(modals)/walletModal"
                options={{ presentation: 'modal' }}
            />
               <Stack.Screen
                name="(modals)/sendnotificationModal"
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="(modals)/transactionModal"
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="(modals)/searchModal"
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="(modals)/info"
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="(modals)/currencyModal"
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="(modals)/incomeModal"
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="(modals)/expenseModal"
                options={{ presentation: 'modal' }}
            />
                    <Stack.Screen
                name="(modals)/addModal"
                options={{ presentation: 'modal' }}
            />
        </Stack>
    );
};

export default function RootLayout() {
    useEffect(() => {
        // Prevent auto-hiding initially
        SplashScreen.preventAutoHideAsync();
        
        // Hide splash screen after everything is ready
        const hideSplash = async () => {
            await SplashScreen.hideAsync();
        };
        
        hideSplash();
    }, []);

    return (
        <AuthProvider>
            <StackLayout />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({});