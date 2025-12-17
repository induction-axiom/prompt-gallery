import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const getRecentTemplates = async (limitCount = 10) => {
    const q = query(
        collection(db, "prompts"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

export const saveExecutionMetadata = async ({ templateId, user, storagePath, downloadURL, reqBody }) => {
    return await addDoc(collection(db, "executions"), {
        promptId: templateId,
        userId: user.uid,
        createdAt: serverTimestamp(),
        storagePath: storagePath,
        imageUrl: downloadURL,
        creatorId: user.uid,
        inputVariables: reqBody,
        public: true
    });
};
