// Tryon.tsx
import { Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native'
import React, { useState } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'
import Header from '@/components/Header'
import Typo from '@/components/Typo'
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons'; 
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
//import SendRequestModal from '../(modals)/sendnotificationModal' // Removed this import
import { useRouter } from 'expo-router'

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
      aspect: [4, 5],
      quality: 1,
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
      aspect: [4, 5],
      quality: 1,
    });

    if (!result.canceled) {
      setUserImage(result.assets[0].uri);
      setResultImage(null); // Clear previous result when selecting new images
    }
  };

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
        <Header title="Virtual Try-On" style={{ marginVertical: spacingY._10 }} />
       
        <Typo size={16} style={styles.description} color={colors.neutral400}>
          Upload a shirt image and your photo to see how it looks on you
        </Typo>

        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Typo size={14} style={styles.imageLabel}>Shirt Image</Typo>
            {shirtImage ? (
              <Image
                source={{ uri: shirtImage }}
                style={styles.previewImage}
                contentFit="contain"
              />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="shirt-outline" size={40} color={colors.neutral400} />
              </View>
            )}
          </View>

          <View style={styles.imageWrapper}>
            <Typo size={14} style={styles.imageLabel}>Your Image</Typo>
            {userImage ? (
              <Image
                source={{ uri: userImage }}
                style={styles.previewImage}
                contentFit="contain"
              />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="person-outline" size={40} color={colors.neutral400} />
              </View>
            )}
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
              <Typo size={16} color={colors.white}>Send Request</Typo>
             
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.uploadButton]}
            onPress={pickShirtImage}
            disabled={loading}
          >
            <Ionicons name="shirt" size={20} color={colors.white} />
            <Typo size={16} color={colors.white}>Upload Shirt</Typo>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.uploadButton]}
            onPress={pickUserImage}
            disabled={loading}
          >
            <Ionicons name="person" size={20} color={colors.white} />
            <Typo size={16} color={colors.white}>Upload Your Image</Typo>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.confirmButton, loading && styles.disabledButton]}
            onPress={handleConfirm}
            disabled={!shirtImage || !userImage || loading}
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
  },
  requestButton: {
    backgroundColor: colors.neutral350,
    marginTop: verticalScale(15),
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
  },
  previewImage: {
    width: '100%',
    height: verticalScale(200),
    borderRadius: radius._10,
    backgroundColor: colors.neutral700,
  },
  placeholder: {
    width: '100%',
    height: verticalScale(200),
    borderRadius: radius._10,
    backgroundColor: colors.neutral700,
    justifyContent: 'center',
    alignItems: 'center',
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


})