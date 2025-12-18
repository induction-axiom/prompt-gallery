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
const { systemPrompts } = require("./config/systemPrompts");


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

// Helper to ensure the user is an admin
// Helper to ensure the user is an admin
function ensureAdmin(auth) {
    const allowedEmails = ['jongluo@google.com'];
    if (!auth || (!auth.token.admin && !allowedEmails.includes(auth.token.email))) {
        throw new HttpsError('permission-denied', 'Admin access required');
    }
}

// Helper to perform the actual update against Vertex AI and Firestore
async function executePromptUpdate(templateId, updates) {
    if (!updates || Object.keys(updates).length === 0) {
        throw new HttpsError('invalid-argument', 'No fields to update');
    }

    let apiResult = null;

    // 1. Update Vertex AI Logic
    // Vertex only cares about displayName and templateString
    const vertexUpdates = {};
    if (updates.displayName) vertexUpdates.displayName = updates.displayName;
    if (updates.templateString) vertexUpdates.templateString = updates.templateString;

    if (Object.keys(vertexUpdates).length > 0) {
        const updateMask = Object.keys(vertexUpdates).join(',');
        const requestUrl = `${BASE_URL}/${templateId}?updateMask=${updateMask}`;

        apiResult = await makeApiRequest({
            url: requestUrl,
            method: "PATCH",
            data: vertexUpdates,
        });
    }

    // 2. Sync to Firestore
    // Firestore cares about displayName and jsonInputSchema
    const firestoreUpdates = {};
    if (updates.displayName) firestoreUpdates.displayName = updates.displayName;
    if (updates.jsonInputSchema !== undefined) firestoreUpdates.jsonInputSchema = updates.jsonInputSchema;

    if (Object.keys(firestoreUpdates).length > 0) {
        await updateTemplateInFirestore(templateId, firestoreUpdates);
    }

    return apiResult;
}

exports.syncSystemPrompts = onCall(
    { maxInstances: 1, enforceAppCheck: true },
    async (request) => {
        ensureAdmin(request.auth);

        logger.info("Starting syncSystemPrompts");
        const results = [];

        for (const [id, promptData] of Object.entries(systemPrompts)) {
            try {
                await executePromptUpdate(
                    id,
                    {
                        displayName: promptData.displayName,
                        templateString: promptData.templateString,
                        jsonInputSchema: promptData.jsonInputSchema
                    }
                );

                results.push({ id, status: 'success' });
            } catch (error) {
                logger.error(`Failed to sync prompt ${id}`, error);
                results.push({ id, status: 'error', error: error.message });
            }
        }

        return { results };
    }
);

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
        const { templateId, displayName, dotPromptString, jsonInputSchema } = request.data;
        if (!templateId) throw new HttpsError('invalid-argument', 'Missing templateId');

        logger.info("updatePromptTemplate", { templateId });

        // Check ownership
        await verifyOwnership(templateId, request.auth);

        const updates = {};
        if (displayName) updates.displayName = displayName;
        if (dotPromptString) updates.templateString = dotPromptString;
        if (jsonInputSchema !== undefined) updates.jsonInputSchema = jsonInputSchema;

        const result = await executePromptUpdate(templateId, updates);

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