const { getFirestore, FieldValue } = require("firebase-admin/firestore");

/**
 * Rebuilds the global tag list from all prompts.
 * This is an expensive operation and should be used sparingly.
 */
async function performTagRebuild() {
    const db = getFirestore();
    const promptsRef = db.collection("prompts");
    const snapshot = await promptsRef.select("tags").get();

    const allTagsSet = new Set();
    let promptsCount = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.tags && Array.isArray(data.tags)) {
            data.tags.forEach(tag => allTagsSet.add(tag));
            promptsCount++;
        }
    });

    const allTagsList = Array.from(allTagsSet).sort();

    await db.doc("metadata/tags").set({
        allTags: allTagsList,
        lastRebuild: FieldValue.serverTimestamp(),
        lastUpdated: FieldValue.serverTimestamp()
    });

    return { tagCount: allTagsList.length, promptsCount };
}

/**
 * Merges new tags into the global tag list using arrayUnion.
 * This is efficient and safe for concurrent updates.
 * @param {Array<string>} newTags - The tags to add.
 */
async function mergeTagsIntoGlobalList(newTags) {
    if (!newTags || !Array.isArray(newTags) || newTags.length === 0) {
        return;
    }

    const db = getFirestore();
    const metadataRef = db.doc("metadata/tags");

    // arrayUnion handles uniqueness automatically
    await metadataRef.set({
        allTags: FieldValue.arrayUnion(...newTags),
        lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });
}

module.exports = {
    performTagRebuild,
    mergeTagsIntoGlobalList
};
