import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'
import Header from '@/components/Header'
import Typo from '@/components/Typo'
import { useAuth } from '@/contexts/authContext'
import { Image } from 'expo-image';
import { getProfileImage } from '@/services/imageServices'
import { accountOptionType } from '@/types'
import { Ionicons } from '@expo/vector-icons'; 
import Animated, { FadeInDown } from 'react-native-reanimated'
import { signOut } from 'firebase/auth'
import { auth } from '@/config/firebase'
import { useRouter } from 'expo-router'
const Profile = () => {
  const { user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    console.log('Current user data:', user);
    if (user?.uid) {
      console.log('User UID:', user.uid);
    }
    if (user?.phone) {
      console.log('User phone number:', user.phone);
    } else {
      console.log('No phone number found for user');
    }
  }, [user]);
  const accountOptions: accountOptionType[] = [
    {
      title: user?.isBuyer ? "Edit Profile" : "Edit Store",
      icon: (
        <Ionicons
          name="person"
          size={26}
          color={colors.white}
        />
      ),
      routeName: user?.isBuyer 
        ? '/(modals)/profileModal' 
        : '/(modals)/storedetailsModal', // placeholder for store details modal
      bgColor: "#6366f1",
    },
    {
      title: "Logout",
      icon: (
        <Ionicons
          name="power"
          size={26}
          color={colors.white}
        />
      ),
      bgColor: "#e11d48",
    },
  ];
  
  // Post ad option for sellers

  if (!user?.isBuyer) {
    accountOptions.push({
      title: "Post an ad",
      icon: (
        <Ionicons
          name="add"
          size={26}
          color={colors.white}
        />
      ),
      routeName: '/(modals)/addModal',
      bgColor: "orange",
    });
  }
  
  const handleLogout = async() =>{
    await signOut(auth);
  }
  const showLogoutAlert = ()=>{
    Alert.alert("Confirm", "Are you sure you want to logout?", [
      {
        text:"Cancel",
        onPress: ()=>console.log('cancel logout'),
        style:'cancel'
      },
      {
        text:"Logout",
        onPress: ()=>handleLogout(),
        style:'destructive'
      },
      
    ])
  }
  const handlePress = async(item: accountOptionType)=>{
    if(item.title == 'Logout'){
      showLogoutAlert();
    }

    if(item.routeName) router.push(item.routeName);
  };
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header title="Profile" style={{ marginVertical: spacingY._10 }} />

        <View style={styles.userInfo}>
          <View>
            <Image
              source={getProfileImage(user?.image)}
              style={styles.avatar}
              contentFit="cover"
              transition={100} />
          </View>

          <View style={styles.nameContainer}>
            <Typo size={24} fontWeight={'600'} color={colors.neutral100}  >{user?.name}</Typo>
            <Typo size={15} color={colors.neutral400}  >{user?.email}</Typo>
            {user?.phone && (
      <Typo size={15} color={colors.neutral400} style={styles.phoneText}>
        <Ionicons name="call" size={14} color={colors.neutral400} /> {user.phone}
      </Typo>
    )}

          </View>
        </View>

        <View style={styles.accountOptions}>
          {accountOptions.map((item, index) => {
            return (

              <Animated.View
                key={index.toString()}
                entering={FadeInDown.delay(index * 50).springify().damping(14)} style={styles.listItem}>

                <TouchableOpacity style={styles.flexRow} onPress={()=>handlePress(item)}>
                  <View
                    style={[styles.listIcon, {
                      backgroundColor: item?.bgColor,
                    },
                    ]}>
                    {item.icon && item.icon}
                  </View>
                  <Typo size={16} style={{ flex: 1 }} fontWeight={'500'}>
                    {item.title}
                  </Typo>
                  <Ionicons
                    name="chevron-forward"
                    size={verticalScale(20)}
                    color={colors.white}
                  />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

      </View>
    </ScreenWrapper>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  phoneText: {
    marginTop: verticalScale(4),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
  },
  userInfo: {
    marginTop: verticalScale(30),
    alignItems: "center",
    gap: spacingY._15,
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
    overflow: "hidden",
    // position: "relative",
  },
  nameContainer: {
    gap: verticalScale(4),
    alignItems: "center",
  },

  listIcon: {
    height: verticalScale(44),
    width: verticalScale(44),
    backgroundColor: colors.neutral500,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius._15,
    borderCurve: "continuous",
  },

  listItem: {
    marginBottom: verticalScale(17),
  },
  editIcon: {
    position: "absolute",
    bottom: 5,
    right: 8,
    borderRadius: 50,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: 5,
  },

  accountOptions: {
    marginTop: spacingY._35,
  },

  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
})