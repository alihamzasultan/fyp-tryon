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
