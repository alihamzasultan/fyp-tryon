// Tryon.tsx
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import React, { useState, useMemo } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import { verticalScale  } from '@/utils/styling'; // Import horizontalScale
import Header from '@/components/Header';
import Typo from '@/components/Typo';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import BackButton from '@/components/BackButton';

const API_URL = "https://web-production-89bd.up.railway.app";

const Tryon = () => {
  const router = useRouter();
  const [shirtImage, setShirtImage] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [selectedShirtImage, setSelectedShirtImage] = useState<string | null>(null);  // New state
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const pickShirtImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4], // Adjust aspect ratio for better fit
      quality: 0.7,  // Reduce quality for faster processing
    });

    if (!result.canceled) {
      setShirtImage(result.assets[0].uri);
      setResultImage(null); // Clear previous result when selecting new images
    }
  };

  const pickUserImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4], // Adjust aspect ratio for better fit
      quality: 0.7, // Reduce quality for faster processing
    });

    if (!result.canceled) {
      setUserImage(result.assets[0].uri);
      setResultImage(null); // Clear previous result when selecting new images
    }
  };

    // Use useMemo to derive the isButtonVisible state
    const isTryOnButtonVisible = useMemo(() => {
      return shirtImage !== null && userImage !== null;
    }, [shirtImage, userImage]);


  const handleConfirm = async () => {
    if (!shirtImage || !userImage) {
      Alert.alert("Error", "Please select both a shirt image and your image");
      return;
    }

    try {
      setLoading(true);

      // Convert images to base64
      const shirtBase64 = await FileSystem.readAsStringAsync(shirtImage, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const userBase64 = await FileSystem.readAsStringAsync(userImage, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Debugging: Log the API call details
      console.log(`Sending request to: ${API_URL}/try-on`);

      // Send to backend
      const response = await fetch(`${API_URL}/try-on`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shirtImage: shirtBase64,
          userImage: userBase64,
        }),
      });

      // Debugging: Log the raw response
      const responseText = await response.text();
      console.log("Raw response:", responseText);

      const data = JSON.parse(responseText);

      if (data.success && data.imageUrl) {
        setResultImage(`${API_URL}${data.imageUrl}`);
      } else {
        throw new Error(data.error || "Failed to process images");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Failed to process images. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (shirtImage) {
      try {
        const shirtBase64 = await FileSystem.readAsStringAsync(shirtImage, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const shirtDataUri = `data:image/jpeg;base64,${shirtBase64}`; // Or the correct MIME type

        router.push({
          pathname: '/(modals)/sendnotificationModal',
          params: { shirtImageUri: shirtDataUri },
        });
      } catch (error) {
        console.error("Error converting image to base64:", error);
        Alert.alert("Error", "Failed to process image. Please try again.");
      }
    } else {
      Alert.alert("Error", "Please upload a shirt image first.");
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>

      <Header
          title="Virtual Try-On"
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10, marginTop:spacingY._10 }}
        />
        {/* <Header title="Virtual Try-On" style={{ marginVertical: spacingY._10 }} /> */}

        <Typo size={16} style={styles.description} color={colors.neutral400}>
          Upload a shirt image and your photo.
        </Typo>

        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Typo size={14} style={styles.imageLabel}>Shirt Image</Typo>
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickShirtImage}>
              {shirtImage ? (
                <Image
                  source={{ uri: shirtImage }}
                  style={styles.previewImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="shirt-outline" size={40} color={colors.neutral400} />
                  <Typo size={12} color={colors.neutral400}>Upload</Typo>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.imageWrapper}>
            <Typo size={14} style={styles.imageLabel}>Your Image</Typo>
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickUserImage}>
              {userImage ? (
                <Image
                  source={{ uri: userImage }}
                  style={styles.previewImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="person-outline" size={40} color={colors.neutral400} />
                  <Typo size={12} color={colors.neutral400}>Upload</Typo>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {resultImage && (
          <View style={styles.resultContainer}>
            <Typo size={14} style={styles.imageLabel}>Result</Typo>
            <Image
              source={{ uri: resultImage }}
              style={styles.resultImage}
              contentFit="contain"
            />
            <TouchableOpacity
              style={[styles.button, styles.requestButton]}
              onPress={handleSendRequest} // Use the new handler
            >
              <Ionicons name="send" size={20} color={colors.white} />
              <Typo size={16} color={colors.white}>Send to Friend</Typo>

            </TouchableOpacity>
          </View>
        )}

        {isTryOnButtonVisible && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.confirmButton, loading && styles.disabledButton]}
            onPress={handleConfirm}
            disabled={loading} // Disable based on loading state only
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Typo size={16} color={colors.white}>Try It On</Typo>
              </>
            )}
          </TouchableOpacity>
        </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  )
}

export default Tryon

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  description: {
    textAlign: 'center',
    marginBottom: verticalScale(30),
    fontSize: 15, // Slightly larger and cleaner font
  },
  requestButton: {
    backgroundColor: colors.primary,
    marginTop: verticalScale(15),
    paddingHorizontal: spacingX._20, // Add horizontal padding
    borderRadius: radius._20, // More rounded corners
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(30),
  },
  imageWrapper: {
    width: '48%',
    alignItems: 'center',
  },
  imageLabel: {
    marginBottom: verticalScale(10),
    color: colors.neutral500,
    fontWeight: '500',
  },
  imagePickerButton: {  // Style for touchable opacity around image
    width: '100%',
    height: verticalScale(200),
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius._10,
  },
  placeholder: {
    width: '100%',
    height: verticalScale(200),
    borderRadius: radius._10,
    backgroundColor: colors.neutral100, // Lighter background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,          // Added border
    borderColor: colors.neutral300,  // Added border color
  },
  buttonsContainer: {
    marginTop: verticalScale(20),
    gap: verticalScale(15),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(15),
    borderRadius: radius._10,
    gap: spacingX._10,
  },
  uploadButton: {
    backgroundColor: colors.primary,
  },
  confirmButton: {
    backgroundColor: colors.green,
    opacity: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  resultContainer: {
    marginTop: verticalScale(20),
    alignItems: 'center',
  },
  resultImage: {
    width: '100%',
    height: verticalScale(300),
    borderRadius: radius._10,
    backgroundColor: colors.neutral700,
  },
});