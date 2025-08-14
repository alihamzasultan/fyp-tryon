import {
  Alert,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { scale, verticalScale } from '@/utils/styling';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import Typo from '@/components/Typo';
import Button from '@/components/Button';
import * as ImagePicker from 'expo-image-picker';
import { uploadFileToCloudinary } from '@/services/imageServices';
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { useAuth } from '@/contexts/authContext';
import { useRouter } from 'expo-router';

const MAX_IMAGES = 4;

import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const AddModal = () => {
  const { adId } = useLocalSearchParams();
  const isEditMode = !!adId;
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  // Fetch existing ad data when editing
  useEffect(() => {
    if (isEditMode) {
      const fetchAdData = async () => {
        try {
          const docRef = doc(firestore, 'ads', adId as string);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const ad = docSnap.data();
            setTitle(ad.title || '');
            setDescription(ad.description || '');
            setPrice(ad.price?.toString() || '');
            setImages(ad.images?.concat([null, null, null, null]).slice(0, 4) || [null, null, null, null]);
          }
        } catch (err) {
          console.error('Failed to fetch ad:', err);
        }
      };
      fetchAdData();
    }
  }, [adId]);
  const pickImage = async (index: number) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access media library is required.');
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
  
      if (!result.canceled && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        setImages((prev) => {
          const newImages = [...prev];
          newImages[index] = selectedImageUri;
          return newImages;
        });
      }
    } catch (error) {
      console.error('Image Picker Error:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };
  
  const handleSubmit = async () => {
    const requiredImages = images.slice(0, 2).filter(Boolean);
    if (requiredImages.length < 2) {
      Alert.alert('Validation Error', 'Please upload at least 2 images.');
      return;
    }

    if (!title || !description || !price) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);

      const uploadedImageUrls = await Promise.all(
        images.map(async (img) => {
          if (img && !img.startsWith('http')) {
            const res = await uploadFileToCloudinary({ uri: img }, 'ads');
            return res.success ? res.data : null;
          }
          return img;
        })
      );

      const payload = {
        uid: user?.uid,
        title,
        description,
        price,
        images: uploadedImageUrls.filter(Boolean),
        updatedAt: new Date(),
      };

      if (isEditMode) {
        const docRef = doc(firestore, 'ads', adId as string);
        await updateDoc(docRef, payload);
        Alert.alert('Success', 'Ad updated successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await addDoc(collection(firestore, 'ads'), {
          ...payload,
          createdAt: new Date(),
        });
        Alert.alert('Success', 'Your ad has been posted.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      console.error('Error posting/updating ad:', err);
      Alert.alert('Error', 'Failed to submit the ad.');
    } finally {
      setLoading(false);
    }
  };

  // ... return JSX unchanged ...


  return (
    <View style={styles.container}>
      <Header
        title="Add Update"
        leftIcon={<BackButton />}
        style={{ marginBottom: spacingY._10 }}
      />

      <ScrollView contentContainerStyle={styles.form}>
        <Typo>Product Images</Typo>
        <View style={styles.imageGrid}>
          {images.map((img, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => pickImage(index)}
              style={styles.imageBox}
            >
              {img ? (
                <Image source={{ uri: img }} style={styles.imagePreview} />
              ) : (
                <Text style={styles.imagePlaceholder}>+</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Title"
          placeholderTextColor={colors.neutral500}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Price"
          placeholderTextColor={colors.neutral500}
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Description"
          placeholderTextColor={colors.neutral500}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Button loading={loading} onPress={handleSubmit}>
          <Typo color={colors.black} fontWeight="700">Post Ad</Typo>
        </Button>
      </ScrollView>
    </View>
  );
};

export default AddModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    backgroundColor: colors.neutral900,
  },
  form: {
    gap: spacingY._20,
    paddingBottom: verticalScale(100),
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingX._10,
  },
  imageBox: {
    width: scale(70),
    height: scale(70),
    backgroundColor: colors.neutral300,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  imagePlaceholder: {
    fontSize: 24,
    color: colors.neutral700,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 8,
    padding: spacingY._10,
    color: colors.black,
    backgroundColor: colors.white,
  },
});
