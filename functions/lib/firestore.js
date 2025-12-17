const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { HttpsError } = require("firebase-functions/v2/https");

// Assume getFirestore() is called after app init in index.js, 
// but it's safer to pass db instance or call it here if app is already initialized globally.
// Since admin.initializeApp() is usually global, this works.
const db = getFirestore();

/**
 * Verify that the current user owns the template.
 * @param {string} templateId 
 * @param {object} authContext request.auth
 * @returns {Promise<FirebaseFirestore.DocumentReference>}
 */
async function verifyOwnership(templateId, authContext) {
    if (!authContext) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
    }
    const docRef = db.collection("prompts").doc(templateId);
    const docFn = await docRef.get();

    if (docFn.exists) {
        const data = docFn.data();
        if (data.ownerId && data.ownerId !== authContext.uid) {
            throw new HttpsError('permission-denied', 'You do not own this template');
        }
    }
}

/**
 * Syncs a new template to Firestore.
 * @param {string} templateId 
 * @param {string} userId 
 * @param {string} jsonInputSchema
 */
async function syncTemplateToFirestore(templateId, userId, jsonInputSchema) {
    await db.collection("prompts").doc(templateId).set({
        createdAt: FieldValue.serverTimestamp(),
        ownerId: userId || 'anonymous',
        public: true,
        jsonInputSchema: jsonInputSchema || ''
    }, { merge: true });
}

/**
 * Updates a template in Firestore.
 * @param {string} templateId 
 * @param {object} data
 */
async function updateTemplateInFirestore(templateId, data) {
    if (Object.keys(data).length === 0) return;
    await db.collection("prompts").doc(templateId).set(data, { merge: true });
}

/**
 * Deletes a template from Firestore.
 * @param {string} templateId 
 */
async function deleteTemplateFromFirestore(templateId) {
    await db.collection("prompts").doc(templateId).delete();
}

module.exports = {
    verifyOwnership,
    syncTemplateToFirestore,
    updateTemplateInFirestore,
    deleteTemplateFromFirestore
};


