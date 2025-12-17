import { ref, uploadString, getDownloadURL } from "firebase/storage";
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
