import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { scale, verticalScale } from '@/utils/styling'
import ScreenWrapper from '@/components/ScreenWrapper'
import ModalWrapper from '@/components/ModalWrapper'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import { Image } from 'expo-image'
import { getProfileImage } from '@/services/imageServices'
import { Feather } from '@expo/vector-icons'; // Add this
import Typo from '@/components/Typo'
import Input from '@/components/Input'
import { UserDataType } from '@/types'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/authContext'
import { updateUser } from '@/services/userServices'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker';

const ProfileModal = () => {
    const {user, updateUserData}=useAuth();
    const [isPhoneValid, setIsPhoneValid] = useState(true);

    const [userData, setUserData]=useState<UserDataType>({
        name: "",
        phone: "",
        image:null,
    });
    const [loading, setLoading]= useState(false);
    const router = useRouter();

    useEffect(()=>{
        setUserData({
            name: user?.name || "",
            phone: user?.phone || "",
            image: user?.image || null,
        })
    }, [user]);

    const onSubmit =async ()=>{
        let {name, phone, image} = userData;
        if(!name.trim()){
            Alert.alert("Error", 'Please enter your name')
            return;
        }
        if(!phone.trim()){
            Alert.alert("Error", 'Please enter your phone number')
            return;
        }
        
        // Basic phone number validation
        const phoneRegex = /^[0-9]{10,15}$/; // Simple regex for 10-15 digits
        if (!phoneRegex.test(phone)) {
            Alert.alert("Error", "Phone must be 10-15 digits");
            return;
          }

        setLoading(true);
        const res = await updateUser(user?.uid as string, userData);
        setLoading(false);
        if(res.success){
            // update user
            updateUserData(user?.uid as string);
            router.back();
        }else{
            Alert.alert("Error", res.msg );
        }
    }

    const onPickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });
        
        if (!result.canceled) {
            setUserData({...userData, image: result.assets[0]});
        }
    };

    return (
        <ModalWrapper>
          <View style={styles.container}>
            <Header title="Update Profile" leftIcon={<BackButton />}
            style={{marginBottom: spacingY._10}}
            />

            <ScrollView contentContainerStyle={styles.form}>
                <View style={styles.avatarContainer}>
                    <Image
                    style={styles.avatar}
                    source={getProfileImage(userData.image)}
                    contentFit="cover"
                    transition={100}
                    />

                    <TouchableOpacity onPress={onPickImage} style={styles.editIcon}>
                    <Feather name="edit-2" size={verticalScale(20)} color={colors.neutral800} />
                    </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                    <Typo color={colors.neutral200}>Name</Typo>
                    <Input
                    placeholder="Name"
                    value={userData.name}
                    onChangeText={(value)=>setUserData({...userData,name:value})}
                    />
                </View>
                <View style={styles.inputContainer}>
  <Typo color={colors.neutral200}>Phone Number</Typo>
  
  <Input
    placeholder="Phone Number"
    value={userData.phone}
    
    onChangeText={(value) => {
      const numbersOnly = value.replace(/[^0-11]/g, '');
      setUserData({...userData, phone: numbersOnly});
      setIsPhoneValid(numbersOnly.length >= 10); // At least 10 digits
    }}
    keyboardType="phone-pad"
  
  />


  {!isPhoneValid && userData.phone && (
    <Typo color={colors.error}>
      Enter Valid Phone number
    </Typo>
  )}
</View>
            </ScrollView>

          </View>

          <View style={styles.footer}>
            <Button onPress={onSubmit} loading={loading} style={{flex:1}}>
                <Typo color={colors.black} fontWeight={'700'}>
                    Update
                </Typo>
            </Button>
          </View>
        </ModalWrapper>
    )
}

export default ProfileModal

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "space-between",
        paddingHorizontal: spacingY._20,
    },
    inputContainer:{
        gap:spacingY._10

    },
  
    footer: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        paddingHorizontal: spacingX._20,
        gap: scale(12),
        paddingTop: spacingY._15,
        borderTopColor: colors.neutral700,
        marginBottom: spacingY._5,
        borderTopWidth: 1,
    },
    form: {
        gap: spacingY._30,
        marginTop: spacingY._15,
    },
    avatarContainer: {
        position: "relative",
        alignSelf: "center",
    },
    avatar: {
        alignSelf: "center",
        backgroundColor: colors.neutral300,
        height: verticalScale(135),
        width: verticalScale(135),
        borderRadius: 200,
        borderWidth: 1,
        borderColor: colors.neutral500,
    },
    editIcon: {
        position: "absolute",
        bottom: spacingY._5,
        right: spacingY._7,
        borderRadius: 100,
        backgroundColor: colors.neutral100,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
        padding: spacingY._7,
    },
})