import { firestore } from "@/config/firebase";
import { ResponseType, UserDataType } from "@/types";
import { doc, updateDoc } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageServices";

export const updateUser = async (
    uid: string,
    updatedData: UserDataType
): Promise<ResponseType> => {
    try {
        // Create a clean update object with only defined fields
        const updateObject: Partial<UserDataType> = {
            name: updatedData.name, // Name is required
        };

        // Handle phone number if provided
        if (updatedData.phone) {
            updateObject.phone = updatedData.phone;
        }

        // Handle address if provided
        if (updatedData.address) {
            updateObject.address = updatedData.address;
        }

        // Handle image upload if provided
        if (updatedData.image && updatedData.image.uri) {
            const imageUploadRes = await uploadFileToCloudinary(updatedData.image, "users");
            if (!imageUploadRes.success) {
                return { success: false, msg: imageUploadRes.msg || "Failed to upload image" };
            }
            updateObject.image = imageUploadRes.data;
        }

        const userRef = doc(firestore, "users", uid);
        await updateDoc(userRef, updateObject);

        return { success: true, msg: "Profile updated successfully" };
    } catch (error: any) {
        console.error("Error updating user:", error);
        return { 
            success: false, 
            msg: error?.message || "An unknown error occurred" 
        };
    }
};



export interface SellerDataType {
  userId: string;
  storeName: string;
  storeLocation: string;
  storeDescription?: string;
  storeLogo?: { uri?: string } | string | null;
  storeBanner?: { uri?: string } | string | null;
}

export const updateSeller = async (
  sellerId: string, // Firestore document ID for seller
  updatedData: SellerDataType
): Promise<ResponseType> => {
  try {
    const updateObject: Partial<SellerDataType> = {
      storeName: updatedData.storeName,
      storeLocation: updatedData.storeLocation,
      storeDescription: updatedData.storeDescription || "",
      userId: updatedData.userId,
    };

    // Upload logo if new file
    if (updatedData.storeLogo && (updatedData.storeLogo as any).uri) {
      const logoRes = await uploadFileToCloudinary(updatedData.storeLogo, "stores/logos");
      if (!logoRes.success) {
        return { success: false, msg: logoRes.msg || "Failed to upload store logo" };
      }
      updateObject.storeLogo = logoRes.data;
    } else if (typeof updatedData.storeLogo === "string") {
      updateObject.storeLogo = updatedData.storeLogo;
    }

    // Upload banner if new file
    if (updatedData.storeBanner && (updatedData.storeBanner as any).uri) {
      const bannerRes = await uploadFileToCloudinary(updatedData.storeBanner, "stores/banners");
      if (!bannerRes.success) {
        return { success: false, msg: bannerRes.msg || "Failed to upload store banner" };
      }
      updateObject.storeBanner = bannerRes.data;
    } else if (typeof updatedData.storeBanner === "string") {
      updateObject.storeBanner = updatedData.storeBanner;
    }

    const sellerRef = doc(firestore, "sellers", sellerId);
    await updateDoc(sellerRef, updateObject);

    return { success: true, msg: "Seller profile updated successfully" };
  } catch (error: any) {
    console.error("Error updating seller:", error);
    return { success: false, msg: error?.message || "An unknown error occurred" };
  }
};
