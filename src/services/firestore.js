import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, where, deleteDoc, doc, runTransaction, setDoc, getDoc, startAfter } from "firebase/firestore";
import { db } from "../firebase";

export const getRecentTemplates = async (limitCount = 10, orderByField = "createdAt", startAfterDoc = null, filterTags = []) => {
    let q = collection(db, "prompts");

    // "array-contains-any" limits to 10 items.
    // If filterTags is present, we MUST use it as the primary filter.
    // Note: Firestore requires a composite index for array-contains-any + orderBy

    const constraints = [
        where("public", "==", true)
    ];

    if (filterTags && filterTags.length > 0) {
        constraints.push(where("tags", "array-contains-any", filterTags.slice(0, 10)));
    }

    constraints.push(orderBy(orderByField, "desc"));
    constraints.push(limit(limitCount));

    if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
    }

    const finalQuery = query(q, ...constraints);

    const querySnapshot = await getDocs(finalQuery);


    return {
        templates: querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })),
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null
    };
};

export const getTemplatesByAuthor = async (userId, limitCount = 10, orderByField = "createdAt", startAfterDoc = null) => {
    let q = collection(db, "prompts");
    const constraints = [
        where("public", "==", true),
        where("ownerId", "==", userId),
        orderBy(orderByField, "desc"),
        limit(limitCount)
    ];

    if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
    }

    const finalQuery = query(q, ...constraints);
    const querySnapshot = await getDocs(finalQuery);

    return {
        templates: querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })),
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null
    };
};


const executionsCache = new Map();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getTemplateExecutions = async (templateId, limitCount = 10) => {
    // Check cache first
    if (executionsCache.has(templateId)) {
        const { data, timestamp } = executionsCache.get(templateId);
        if (Date.now() - timestamp < CACHE_TTL) {
            return data;
        }
        executionsCache.delete(templateId);
    }

    try {
        const q2 = query(
            collection(db, "executions"),
            where("promptId", "==", templateId),
            where("public", "==", true),
            orderBy("likeCount", "desc"),
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
        executionsCache.set(templateId, {
            data: finalExecutions,
            timestamp: Date.now() // Add timestamp for TTL
        });

        return finalExecutions;
    } catch (e) {
        console.error("Error fetching creations:", e);
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
        console.error("Error deleting creation:", e);
        throw e;
    }
};

const getUserLikesHelper = async (userId, listCollectionName) => {
    if (!userId) return [];
    try {
        const q = query(collection(db, `users/${userId}/${listCollectionName}`));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.id);
    } catch (e) {
        console.error(`Error fetching user ${listCollectionName}:`, e);
        return [];
    }
};

export const getUserLikes = async (userId) => {
    return getUserLikesHelper(userId, 'likes');
};

export const getUserExecutionLikes = async (userId) => {
    return getUserLikesHelper(userId, 'executionLikes');
};

const toggleLikeHelper = async (collectionName, userSubCollection, itemId, userId) => {
    if (!userId || !itemId) throw new Error("Missing userId or itemId");

    const itemRef = doc(db, collectionName, itemId);
    const userLikeRef = doc(db, `users/${userId}/${userSubCollection}`, itemId);

    try {
        await runTransaction(db, async (transaction) => {
            const itemDoc = await transaction.get(itemRef);
            if (!itemDoc.exists()) {
                throw new Error("Item does not exist!");
            }

            const userLikeDoc = await transaction.get(userLikeRef);
            const doesUserLike = userLikeDoc.exists();

            const currentLikeCount = itemDoc.data().likeCount || 0;
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

            transaction.update(itemRef, { likeCount: newLikeCount });
        });
        return true;
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

export const togglePromptLike = async (templateId, userId) => {
    return toggleLikeHelper('prompts', 'likes', templateId, userId);
};

export const toggleExecutionLike = async (executionId, userId) => {
    return toggleLikeHelper('executions', 'executionLikes', executionId, userId);
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
            data: {
                ...userData,
                lastLogin: new Date()
            },
            timestamp: Date.now()
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
        const { data, timestamp } = userProfileCache.get(userId);
        if (Date.now() - timestamp < CACHE_TTL) {
            return data;
        }
        userProfileCache.delete(userId);
    }

    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            userProfileCache.set(userId, {
                data: userData,
                timestamp: Date.now()
            });
            return userData;
        }
    } catch (e) {
        console.error("Error fetching user profile:", e);
    }
    return null;
};

