import { ResponseType, WalletType } from "@/types";
import { uploadFileToCloudinary } from "./imageServices";
import { collection, deleteDoc, doc, Firestore, getDocs, query, setDoc, where, writeBatch } from "firebase/firestore";
import { firestore } from "@/config/firebase";
export const createOrUpdateWallet = async (
    walletData: Partial<WalletType>
): Promise<ResponseType> => {
    try {
        let walletToSave = { ...walletData };
        if (walletData.image) {
            const imageUploadRes = await uploadFileToCloudinary(walletData.image, "wallets");
            if (!imageUploadRes.success) {
                return { success: false, msg: imageUploadRes.msg || "Failed to upload wallet icon" };
            }
            walletToSave.image = imageUploadRes.data; // Assuming uploadFileToCloudinary returns the uploaded image URL in data
        }
        if (!walletData?.id) {
            // new wallet
            walletToSave.amount = 0;
            walletToSave.totalIncome = 0;
            walletToSave.totalExpenses = 0;
            walletToSave.created = new Date();

        }
        const walletRef = walletData?.id
            ? doc(firestore, "wallets", walletData?.id)
            : doc(collection(firestore, "wallets"));
        await setDoc(walletRef, walletToSave, { merge: true })
        return { success: true, data: { ...walletToSave, id: walletRef.id } };

    } catch (error: any) {
        console.log("error creating or updating wallet: ", error);
        return { success: false, msg: error.message };
    }
};

export const deleteWallet = async (
    walletId: string
): Promise<ResponseType> => {
    try {
        const walletRef = doc(firestore, "wallets", walletId);
        await deleteDoc(walletRef);
        deleteTransactionsByWalletId(walletId);

        return { success: true, msg: "Wallet deleted successfully" };
    } catch (error: any) {
        console.log("error deleting wallet: ", error);
        return { success: false, msg: error.message };
    }
};

export const deleteTransactionsByWalletId = async (
    walletId: string
): Promise<ResponseType> => {
    try {
        let hasMoreTransactions = true;
        while (hasMoreTransactions) {
            const transactionsQuery = query(
                collection(firestore, 'transactions'),
                where('walletId', '==', walletId)
            );
            const transactionsSnapshot = await getDocs(transactionsQuery);
            if (transactionsSnapshot.size === 0) {
                hasMoreTransactions = false;
                break;
            }
            const batch = writeBatch(firestore);
            transactionsSnapshot.forEach((transactionDoc) => {
                batch.delete(transactionDoc.ref);
            });
            await batch.commit();
        }

        return {
            success: true,
            msg: "All transactions deleted successfully",
        };
    } catch (error: any) {
        console.log("error deleting wallet: ", error);
        return { success: false, msg: error.message };
    }
};
