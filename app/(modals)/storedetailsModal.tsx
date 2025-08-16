import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useState, useEffect } from 'react'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { scale, verticalScale } from '@/utils/styling'
import ModalWrapper from '@/components/ModalWrapper'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import { Image } from 'expo-image'
import { getProfileImage, uploadFileToCloudinary } from '@/services/imageServices'
import { Feather } from '@expo/vector-icons'
import Typo from '@/components/Typo'
import Input from '@/components/Input'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/authContext'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { 
  addDoc, 
  collection, 
  serverTimestamp, 
  doc, 
  getDoc, 
  updateDoc,
  getDocs,
  query,
  where,
  limit
} from 'firebase/firestore'
import { firestore } from '@/config/firebase'

const StoreDetailModal = () => {
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)

  const [storeData, setStoreData] = useState({
    name: '',
    location: '',
    description: '',
    logo: null as any,
    banner: null as any,
    rating:''
  })

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!user?.uid) return
      
      try {
        setLoading(true)
        // Query stores collection for a store with matching ownerId
        const storesRef = collection(firestore, 'stores')
        const q = query(storesRef, where('ownerId', '==', user.uid), limit(1))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0]
          const data = doc.data()
          setStoreId(doc.id)
          setIsEditing(true)
          setStoreData({
            name: data.name || '',
            location: data.location || '',
            description: data.description || '',
            logo: data.logo || null,
            banner: data.banner || null,
            rating:data.rating
          })
        }
      } catch (err) {
        console.error('Error fetching store data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStoreData()
  }, [user?.uid])

  // ... rest of the component remains the same ...

  const pickImage = async (field: 'logo' | 'banner') => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: field === 'banner' ? [16, 9] : [1, 1],
      quality: 0.7,
    })

    if (!result.canceled) {
      setStoreData({ ...storeData, [field]: result.assets[0] })
    }
  }

  const onSubmit = async () => {
    const { name, location, description, logo, banner } = storeData

    if (!name.trim()) return Alert.alert('Error', 'Please enter store name')
    if (!location.trim()) return Alert.alert('Error', 'Please enter store location')
    if (!description.trim()) return Alert.alert('Error', 'Please enter store description')
    if (!logo) return Alert.alert('Error', 'Please upload store logo')
    if (!banner) return Alert.alert('Error', 'Please upload banner image')

    try {
      setLoading(true)

      // For new images (when user selects new images), upload them
      let logoUrl = typeof logo === 'string' ? logo : null
      let bannerUrl = typeof banner === 'string' ? banner : null

      if (typeof logo !== 'string') {
        const logoUpload = await uploadFileToCloudinary(logo, 'store-logos')
        if (!logoUpload.success) throw new Error(logoUpload.msg || 'Failed to upload logo')
        logoUrl = logoUpload.data
      }

      if (typeof banner !== 'string') {
        const bannerUpload = await uploadFileToCloudinary(banner, 'store-banners')
        if (!bannerUpload.success) throw new Error(bannerUpload.msg || 'Failed to upload banner')
        bannerUrl = bannerUpload.data
      }

      if (isEditing && storeId) {
        // Update existing store
        await updateDoc(doc(firestore, 'stores', storeId), {
          name,
          location,
          description,
          logo: logoUrl,
          banner: bannerUrl,
          updatedAt: serverTimestamp(),
        })
      } else {
        // Create new store
        await addDoc(collection(firestore, 'stores'), {
          name,
          location,
          description,
          logo: logoUrl,
          banner: bannerUrl,
          ownerId: user?.uid,
          createdAt: serverTimestamp(),
        })
      }

      setLoading(false)
      router.back()
    } catch (err: any) {
      setLoading(false)
      Alert.alert('Error', err.message || 'Something went wrong')
    }
  }

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header 
          title={isEditing ? "Edit Store" : "Add Store"} 
          leftIcon={<BackButton />} 
          style={{ marginBottom: spacingY._10 }} 
        />

        <ScrollView contentContainerStyle={styles.form}>
          {/* Banner */}
          <View style={styles.bannerContainer}>
            <Image
              style={styles.banner}
              source={getProfileImage(storeData.banner)}
              contentFit="cover"
              transition={100}
            />
            <TouchableOpacity onPress={() => pickImage('banner')} style={styles.editIcon}>
              <Feather name="edit-2" size={verticalScale(20)} color={colors.neutral800} />
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.avatarContainer}>
            <Image
              style={styles.avatar}
              source={getProfileImage(storeData.logo)}
              contentFit="cover"
              transition={100}
            />
            <TouchableOpacity onPress={() => pickImage('logo')} style={styles.editIcon}>
              <Feather name="edit-2" size={verticalScale(20)} color={colors.neutral800} />
            </TouchableOpacity>
          </View>

          {/* Store Name */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Store Name</Typo>
            <Input
              placeholder="Enter store name"
              value={storeData.name}
              onChangeText={(v) => setStoreData({ ...storeData, name: v })}
            />
          </View>

          {/* Location */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Location</Typo>
            <Input
              placeholder="Enter store location"
              value={storeData.location}
              onChangeText={(v) => setStoreData({ ...storeData, location: v })}
            />
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Description</Typo>
            <Input
              placeholder="Enter store description"
              value={storeData.description}
              onChangeText={(v) => setStoreData({ ...storeData, description: v })}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button onPress={onSubmit} loading={loading} style={{ flex: 1 }}>
          <Typo color={colors.black} fontWeight={'700'}>
            {isEditing ? 'Update Store' : 'Save Store'}
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  )
}

export default StoreDetailModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacingY._20,
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
  inputContainer: {
    gap: spacingY._10,
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginTop: -verticalScale(50),
  },
  avatar: {
    height: verticalScale(100),
    width: verticalScale(100),
    borderRadius: 100,
    backgroundColor: colors.neutral300,
    borderWidth: 1,
    borderColor: colors.neutral500,
  },
  bannerContainer: {
    position: 'relative',
    height: verticalScale(150),
    borderRadius: scale(10),
    overflow: 'hidden',
    backgroundColor: colors.neutral300,
  },
  banner: {
    height: '100%',
    width: '100%',
  },
  editIcon: {
    position: 'absolute',
    bottom: spacingY._5,
    right: spacingY._7,
    borderRadius: 100,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: spacingY._7,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },
})