import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useRef, useState } from 'react'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'
import ScreenWrapper from '@/components/ScreenWrapper'
import BackButton from '@/components/BackButton'
import Typo from '@/components/Typo';
import Input from '@/components/Input'
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';  
import Button from '@/components/Button'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/authContext'
import { sendEmailVerification } from 'firebase/auth'
const Register = () => {

    const emailRef = useRef("");
    const passwordRef = useRef("");
    const nameRef = useRef("");
    const [isLoading, setIsLoading] = useState(false);
    const [isBuyer, setIsBuyer] = useState(true); // default buyer

    const router = useRouter();
    const { register: registerUser } = useAuth();

    const handleSubmit = async () => {
        if (!emailRef.current || !passwordRef.current || !nameRef.current) {
          Alert.alert("Sign Up", "Please fill all the fields");
          return;
        }
      
        setIsLoading(true);
        const res = await registerUser(
          emailRef.current,
          passwordRef.current,
          nameRef.current,
          isBuyer,
        );
        setIsLoading(false);
      
        if (!res.success) {
          Alert.alert('SignUp', res.msg || 'Something went wrong');
          return;
        }
      
        // ✅ Only send verification if user exists
        if (res.success) {
            Alert.alert(
              "Email Verification",
              "A verification link has been sent to your email."
            );
            router.push("/(auth)/login");
          }
          
      };
      

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <BackButton iconSize={28} />
                <View style={{ gap: 5, marginTop: spacingY._20 }}>
                    <Typo size={30} fontWeight={"800"}>
                        Let's
                    </Typo>
                    <Typo size={30} fontWeight={"800"}>
                        Get Started
                    </Typo>
                </View>

                {/* form */}
                <View style={styles.form}>
                    <Typo size={16} color={colors.textLighter}>
                        Create an account to try all your designs
                    </Typo>
                    <Input
                        placeholder='Enter your name'
                        onChangeText={(value) => (nameRef.current = value)}
                        icon={
                            <Ionicons name="person" size={verticalScale(26)} color={colors.neutral300} />
                        }
                    />
                    <Input
                        placeholder='Enter your email'
                        onChangeText={(value) => (emailRef.current = value)}
                        icon={
                            <MaterialIcons name="email" size={verticalScale(26)} color={colors.neutral300} />
}
                    />

                    <Input
                        placeholder='Enter your password'
                        secureTextEntry
                        onChangeText={(value) => (passwordRef.current = value)}
                        icon={
                            <Feather name="lock" size={verticalScale(26)} color={colors.neutral300} />
                        }
                    />

                    <View style={styles.checkboxContainer}>
                    <Pressable
                        style={[styles.checkbox, isBuyer && styles.checked]}
                        onPress={() => setIsBuyer(!isBuyer)}
                    >
                        {isBuyer && (
                        <Ionicons name="checkmark" size={18} color={colors.white} />
                        )}
                    </Pressable>
                    <Typo size={15}>
                        {isBuyer ? "Registering as Buyer" : "Registering as Seller"}
                    </Typo>
                    </View>


                    <Button loading={isLoading} onPress={handleSubmit}>

                        <Typo fontWeight={'700'} color={colors.black} size={21}>
                            Sign Up
                        </Typo>


                    </Button>
                </View>

                <View style={styles.footer}>
                    <Typo size={15}>Already have an account?</Typo>
                    <Pressable onPress={() => router.push('/(auth)/login')}>
                        <Typo size={15} fontWeight={'700'} color={colors.primary}>
                            Login
                        </Typo>
                    </Pressable>
                </View>
            </View>
        </ScreenWrapper>
    );
}

export default Register

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: spacingY._30,
        paddingHorizontal: spacingX._20,
    },
    welcomeText: {
        fontSize: verticalScale(20),
        fontWeight: "bold",
        color: colors.text,
    },
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      },
      checkbox: {
        width: 22,
        height: 22,
        borderWidth: 1.5,
        borderColor: colors.neutral300,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 4,
      },
      checked: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      },
      
    form: {
        gap: spacingY._20,
    },
    forgotPassword: {
        textAlign: "right",
        fontWeight: "500",
        color: colors.text,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 5,
    },
    footerText: {
        textAlign: "center",
        color: colors.text,
        fontSize: verticalScale(15),
    },
})