const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { GoogleAuth } = require("google-auth-library");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
// getFirestore is still needed for initialization in lib, but we can init here.
// Actually lib/firestore calls getFirestore() so we just need to ensure app is initialized.
initializeApp();

const { verifyOwnership, syncTemplateToFirestore, updateTemplateInFirestore, deleteTemplateFromFirestore } = require("./lib/firestore");


// Initialize Google Auth
const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform",
});

// Constants
const PROJECT_ID = process.env.GCLOUD_PROJECT;
const LOCATION = "global";
const BASE_URL = `https://firebasevertexai.googleapis.com/v1beta/projects/${PROJECT_ID}/locations/${LOCATION}/templates`;

// Helper for API requests
async function makeApiRequest({ url, method, data, params }) {
    try {
        const client = await auth.getClient();
        const response = await client.request({ url, method, data, params });
        return response.data;
    } catch (error) {
        logger.error(`API Request Failed: ${method} ${url}`, error);
        throw new HttpsError('internal', 'Firebase AI Logic API request failed', error.message);
    }
}

exports.createPromptTemplate = onCall(
    { maxInstances: 10, enforceAppCheck: true },
    async (request) => {
        const { displayName, dotPromptString } = request.data;
        logger.info("createPromptTemplate", { displayName });

        const result = await makeApiRequest({
            url: BASE_URL,
            method: "POST",
            data: {
                displayName: displayName,
                templateString: dotPromptString
            }
        });

        // Sync to Firestore
        const templateId = result.name.split('/').pop();

        await syncTemplateToFirestore(templateId, request.auth ? request.auth.uid : null, request.data.jsonInputSchema);

        logger.info("Prompt created successfully and synced to Firestore");
        return result;
    }
);

exports.deletePromptTemplate = onCall(
    { maxInstances: 10, enforceAppCheck: true },
    async (request) => {
        const { templateId } = request.data;
        if (!templateId) {
            throw new HttpsError('invalid-argument', 'Missing templateId');
        }
        logger.info("deletePromptTemplate", { templateId });

        // Check ownership
        await verifyOwnership(templateId, request.auth);

        const result = await makeApiRequest({
            url: `${BASE_URL}/${templateId}`,
            method: "DELETE",
        });

        // Sync to Firestore
        await deleteTemplateFromFirestore(templateId);

        logger.info("Prompt deleted successfully from Firebase AI Logic and Firestore");
        return result;
    }
);

exports.listPromptTemplates = onCall(
    { maxInstances: 10, enforceAppCheck: true },
    async (request) => {
        logger.info("listPromptTemplates");
        const { pageSize = 50, pageToken = "" } = request.data || {};

        const result = await makeApiRequest({
            url: BASE_URL,
            method: "GET",
            params: { pageSize, pageToken }
        });

        return result;
    }
);

exports.runPromptTemplate = onCall(
    { maxInstances: 10, enforceAppCheck: true },
    async (request) => {
        const { templateId, reqBody } = request.data;
        if (!templateId) throw new HttpsError('invalid-argument', 'Missing templateId');

        logger.info("runPromptTemplate", { templateId });
        const runUrl = `https://firebasevertexai.googleapis.com/v1beta/projects/${PROJECT_ID}/templates/${templateId}:templateGenerateContent`;

        const result = await makeApiRequest({
            url: runUrl,
            method: "POST",
            data: { inputs: reqBody }
        });
        return result;
    }
);

exports.updatePromptTemplate = onCall(
    { maxInstances: 10, enforceAppCheck: true },
    async (request) => {
        const { templateId, displayName, dotPromptString } = request.data;
        if (!templateId) throw new HttpsError('invalid-argument', 'Missing templateId');

        logger.info("updatePromptTemplate", { templateId });

        // Check ownership
        await verifyOwnership(templateId, request.auth);

        const updateFields = [];
        const data = {};

        if (displayName) {
            updateFields.push('displayName');
            data.displayName = displayName;
        }
        if (dotPromptString) {
            updateFields.push('templateString');
            data.templateString = dotPromptString;
        }
        if (updateFields.length === 0) {
            throw new HttpsError('invalid-argument', 'No fields to update');
        }

        const updateMask = updateFields.join(',');
        const requestUrl = `${BASE_URL}/${templateId}?updateMask=${updateMask}`;

        const result = await makeApiRequest({
            url: requestUrl,
            method: "PATCH",
            data: data,
        });

        const firestoreUpdate = {};
        if (request.data.jsonInputSchema !== undefined) {
            firestoreUpdate.jsonInputSchema = request.data.jsonInputSchema;
        }
        await updateTemplateInFirestore(templateId, firestoreUpdate);

        logger.info("Prompt updated successfully");
        return result;
    }
);

exports.getPromptTemplate = onCall(
    { maxInstances: 10, enforceAppCheck: true },
    async (request) => {
        const { templateId } = request.data;
        if (!templateId) {
            throw new HttpsError('invalid-argument', 'Missing templateId');
        }
        logger.info("getPromptTemplate", { templateId });

        const result = await makeApiRequest({
            url: `${BASE_URL}/${templateId}`,
            method: "GET",
        });
        return result;
    }
);

// ----------------------------------------------------------------------------
// Background Triggers for Cascading Deletion
// ----------------------------------------------------------------------------

/**
 * Trigger: When a prompt template is deleted, delete all its executions.
 * Path: prompts/{promptId}
 */
exports.cleanupExecutions = onDocumentDeleted("prompts/{promptId}", async (event) => {
    const snap = event.data;
    const promptId = event.params.promptId;

    if (!snap) {
        // No data associated with the event
        return;
    }

    logger.info(`Cleanup Executions for Prompt: ${promptId}`);

    const db = getFirestore();
    const executionsRef = db.collection("executions");

    // Find all executions linked to this prompt
    const snapshot = await executionsRef.where("promptId", "==", promptId).get();

    if (snapshot.empty) {
        logger.info("No matching executions found.");
        return;
    }

    // Delete matches in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    logger.info(`Deleted ${snapshot.size} executions for prompt ${promptId}`);
});

/**
 * Trigger: When an execution is deleted, delete its associated storage image.
 * Path: executions/{executionId}
 */
exports.cleanupStorage = onDocumentDeleted("executions/{executionId}", async (event) => {
    const snap = event.data;
    // For onDocumentDeleted, snap is the QueryDocumentSnapshot of the document *before* deletion
    if (!snap) {
        return;
    }

    const data = snap.data();
    const storagePath = data.storagePath;

    if (storagePath) {
        logger.info(`Cleanup Storage for Artifact: ${event.params.executionId}, Path: ${storagePath}`);
        try {
            const bucket = getStorage().bucket(); // access default bucket
            const file = bucket.file(storagePath);
            await file.delete();
            logger.info(`Successfully deleted file: ${storagePath}`);
        } catch (error) {
            // If object not found, that's fine, maybe it was already deleted.
            if (error.code === 404) {
                logger.info(`File not found (already deleted?): ${storagePath}`);
            } else {
                logger.error(`Error deleting file ${storagePath}:`, error);
            }
        }
    }
});