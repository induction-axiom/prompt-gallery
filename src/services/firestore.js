import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, where, deleteDoc, doc, runTransaction, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export const getRecentTemplates = async (limitCount = 10, orderByField = "createdAt") => {
    const q = query(
        collection(db, "prompts"),
        where("public", "==", true),
        orderBy(orderByField, "desc"),
        limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

const executionsCache = new Map();

export const getTemplateExecutions = async (templateId, limitCount = 10) => {
    // Check cache first
    if (executionsCache.has(templateId)) {
        return executionsCache.get(templateId);
    }

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
        const executions = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).filter(exec => exec.imageUrl || exec.textContent);

        // Fetch user profiles for each unique creatorId
        const userIds = [...new Set(executions.map(e => e.creatorId || e.userId).filter(Boolean))];
        const userProfiles = {};

        await Promise.all(userIds.map(async (uid) => {
            userProfiles[uid] = await getUserProfile(uid);
        }));

        const finalExecutions = executions.map(exec => ({
            ...exec,
            userProfile: userProfiles[exec.creatorId || exec.userId]
        }));

        // Provide simple invalidation - store in cache
        executionsCache.set(templateId, finalExecutions);

        return finalExecutions;
    } catch (e) {
        console.error("Error fetching executions:", e);
        return [];
    }
};

export const saveExecutionMetadata = async ({ templateId, user, storagePath, downloadURL, reqBody, isImage = true, textContent = null }) => {
    // Invalidate cache for this template
    executionsCache.delete(templateId);

    return await addDoc(collection(db, "executions"), {
        promptId: templateId,
        userId: user.uid,
        createdAt: serverTimestamp(),
        storagePath: storagePath, // Null for textExecutions
        imageUrl: downloadURL,    // Null for textExecutions
        textContent: textContent, // Null for imageExecutions
        creatorId: user.uid,
        inputVariables: reqBody,
        public: true,
        public: true,
        isImage: isImage,
        type: isImage ? 'image' : 'text',
        likeCount: 0
    });
};

export const deleteExecution = async (executionId, templateId = null) => {
    try {
        if (templateId) {
            executionsCache.delete(templateId);
        }
        await deleteDoc(doc(db, "executions", executionId));
        return true;
    } catch (e) {
        console.error("Error deleting execution:", e);
        throw e;
    }
};

export const getUserLikes = async (userId) => {
    if (!userId) return [];
    try {
        const q = query(collection(db, `users/${userId}/likes`));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.id);
    } catch (e) {
        console.error("Error fetching user likes:", e);
        return [];
    }
};

export const togglePromptLike = async (templateId, userId) => {
    if (!userId || !templateId) throw new Error("Missing userId or templateId");

    const templateRef = doc(db, "prompts", templateId);
    const userLikeRef = doc(db, `users/${userId}/likes`, templateId);

    try {
        await runTransaction(db, async (transaction) => {
            const templateDoc = await transaction.get(templateRef);
            if (!templateDoc.exists()) {
                throw new Error("Prompt does not exist!");
            }

            const userLikeDoc = await transaction.get(userLikeRef);
            const doesUserLike = userLikeDoc.exists();

            const currentLikeCount = templateDoc.data().likeCount || 0;
            let newLikeCount;

            if (doesUserLike) {
                // User ALREADY likes it -> UNLIKE
                newLikeCount = Math.max(0, currentLikeCount - 1);
                transaction.delete(userLikeRef);
            } else {
                // User does NOT like it -> LIKE
                newLikeCount = currentLikeCount + 1;
                transaction.set(userLikeRef, {
                    likedAt: serverTimestamp()
                });
            }

            transaction.update(templateRef, { likeCount: newLikeCount });
        });
        return true;
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

export const getUserExecutionLikes = async (userId) => {
    if (!userId) return [];
    try {
        const q = query(collection(db, `users/${userId}/executionLikes`));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.id);
    } catch (e) {
        console.error("Error fetching user execution likes:", e);
        return [];
    }
};

export const toggleExecutionLike = async (executionId, userId) => {
    if (!userId || !executionId) throw new Error("Missing userId or executionId");

    const executionRef = doc(db, "executions", executionId);
    const userLikeRef = doc(db, `users/${userId}/executionLikes`, executionId);

    try {
        await runTransaction(db, async (transaction) => {
            const executionDoc = await transaction.get(executionRef);
            if (!executionDoc.exists()) {
                throw new Error("Artifact does not exist!");
            }

            const userLikeDoc = await transaction.get(userLikeRef);
            const doesUserLike = userLikeDoc.exists();

            const currentLikeCount = executionDoc.data().likeCount || 0;
            let newLikeCount;

            if (doesUserLike) {
                // User ALREADY likes it -> UNLIKE
                newLikeCount = Math.max(0, currentLikeCount - 1);
                transaction.delete(userLikeRef);
            } else {
                // User does NOT like it -> LIKE
                newLikeCount = currentLikeCount + 1;
                transaction.set(userLikeRef, {
                    likedAt: serverTimestamp()
                });
            }

            transaction.update(executionRef, { likeCount: newLikeCount });
        });
        return true;
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

export const syncUserInfo = async (user) => {
    if (!user) return;
    try {
        const userData = {
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email,
            lastLogin: serverTimestamp()
        };

        await setDoc(doc(db, "users", user.uid), userData, { merge: true });

        // Update cache for current user
        userProfileCache.set(user.uid, {
            ...userData,
            // We use local time for cache immediately, but sync sends serverTimestamp
            lastLogin: new Date()
        });
    } catch (e) {
        console.error("Error syncing user info:", e);
    }
};

const userProfileCache = new Map();

export const getUserProfile = async (userId) => {
    if (!userId) return null;

    // Check cache first
    if (userProfileCache.has(userId)) {
        return userProfileCache.get(userId);
    }

    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            userProfileCache.set(userId, userData);
            return userData;
        }
    } catch (e) {
        console.error("Error fetching user profile:", e);
    }
    return null;
};

