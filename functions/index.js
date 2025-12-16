const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleAuth } = require("google-auth-library");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

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
        throw new HttpsError('internal', 'Vertex AI API request failed', error.message);
    }
}

async function verifyOwnership(templateId, auth) {
    if (!auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
    }
    const docRef = db.collection("prompts").doc(templateId);
    const docFn = await docRef.get();

    if (docFn.exists) {
        const data = docFn.data();
        if (data.ownerId && data.ownerId !== auth.uid) {
            throw new HttpsError('permission-denied', 'You do not own this template');
        }
    }
    return docRef; // Return lookup for potential reuse
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
        await db.collection("prompts").doc(templateId).set({
            createdAt: FieldValue.serverTimestamp(),
            ownerId: request.auth ? request.auth.uid : 'anonymous'
        });

        logger.info("Template created successfully and synced to Firestore");
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
        const docRef = await verifyOwnership(templateId, request.auth);

        const result = await makeApiRequest({
            url: `${BASE_URL}/${templateId}`,
            method: "DELETE",
        });

        // Sync to Firestore
        await docRef.delete();

        logger.info("Template deleted successfully from Vertex AI and Firestore");
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

        const templates = result.templates || [];
        if (templates.length === 0) return result;

        // Join with Firestore data to get ownerId
        const templateIds = templates.map(t => t.name.split('/').pop());
        const refs = templateIds.map(id => db.collection("prompts").doc(id));
        const snapshots = await db.getAll(...refs);

        const enrichedTemplates = templates.map((template, index) => {
            const doc = snapshots[index];
            return {
                ...template,
                ownerId: doc.exists ? doc.data().ownerId : null,
                // Also helpful to return createdAt if we have it
                createdAt: doc.exists ? doc.data().createdAt : null
            };
        });

        return { ...result, templates: enrichedTemplates };
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

        // Sync to Firestore if needed
        // (No longer syncing displayName as per user request)

        logger.info("Template updated successfully");
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