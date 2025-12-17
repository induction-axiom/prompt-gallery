import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, where } from "firebase/firestore";
import { db } from "../firebase";

export const getRecentTemplates = async (limitCount = 10) => {
    const q = query(
        collection(db, "prompts"),
        where("public", "==", true),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

export const getTemplateExecutions = async (templateId, limitCount = 10) => {
    // We want executions for this specific template that have an imageUrl
    // Ordered by createdAt desc
    try {
        // Let's refine the query. We want "executions" where promptId == templateId.
        // And we probably only want those with images.

        const q2 = query(
            collection(db, "executions"),
            where("promptId", "==", templateId),
            where("public", "==", true),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q2);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).filter(exec => exec.imageUrl); // Client-side filter for now to be safe if some executions lack images
    } catch (e) {
        console.error("Error fetching executions:", e);
        return [];
    }
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
