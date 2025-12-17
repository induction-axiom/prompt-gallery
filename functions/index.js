const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleAuth } = require("google-auth-library");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
// getFirestore is still needed for initialization in lib, but we can init here.
// Actually lib/firestore calls getFirestore() so we just need to ensure app is initialized.
initializeApp();

const { verifyOwnership, syncTemplateToFirestore, deleteTemplateFromFirestore, updateTemplateIsImage } = require("./lib/firestore");
const { isImageModel } = require("./lib/utils");

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
        const isImage = isImageModel(dotPromptString);

        await syncTemplateToFirestore(templateId, request.auth ? request.auth.uid : null, isImage);

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
        await verifyOwnership(templateId, request.auth);

        const result = await makeApiRequest({
            url: `${BASE_URL}/${templateId}`,
            method: "DELETE",
        });

        // Sync to Firestore
        await deleteTemplateFromFirestore(templateId);

        logger.info("Template deleted successfully from Firebase AI Logic and Firestore");
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

        // Sync to Firestore if needed
        if (dotPromptString) {
            const isImage = isImageModel(dotPromptString);
            await updateTemplateIsImage(templateId, isImage);
        }

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