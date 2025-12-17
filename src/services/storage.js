import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

export const uploadImage = async (userId, templateId, base64Data, mimeType) => {
    const timestamp = Date.now();
    const storagePath = `generated_images/${userId}/${timestamp}_${templateId}.png`;
    const storageRef = ref(storage, storagePath);

    await uploadString(storageRef, base64Data, 'base64', {
        contentType: mimeType,
        customMetadata: {
            public: "true"
        }
    });

    const downloadURL = await getDownloadURL(storageRef);
    return { storagePath, downloadURL };
};

export const downloadImage = async (storagePath) => {
    const storageRef = ref(storage, storagePath);
    return await getDownloadURL(storageRef);
};

export const deleteImage = async (storagePath) => {
    if (!storagePath) return; // Nothing to delete
    const storageRef = ref(storage, storagePath);
    return await deleteObject(storageRef);
};
