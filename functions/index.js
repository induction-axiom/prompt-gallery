

const { onCall } = require("firebase-functions/v2/https");
const { GoogleAuth } = require("google-auth-library");
const { logger } = require("firebase-functions");

// Initialize Google Auth to get a token for the Service Account
const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform",
});

exports.createPromptTemplate = onCall(
    {
        maxInstances: 10,
        enforceAppCheck: true
    },
    async (request) => {
        logger.info("createPromptTemplate function invoked.", { structuredData: true });

        const { templateId, promptText, modelName } = request.data;
        const projectId = process.env.GCLOUD_PROJECT;
        const location = "global";
        logger.info(`Received request for Template ID: ${templateId}`, { model: modelName });
        const url = `https://firebasevertexai.googleapis.com/v1beta/projects/${projectId}/locations/${location}/promptTemplates?promptTemplateId=${templateId}`;
        try {
            const client = await auth.getClient();
            const response = await client.request({
                url: url,
                method: "POST",
                data: {
                    displayName: templateId,
                    model: modelName || "gemini-1.5-flash",
                    prompt: { text: promptText }
                },
            });
            logger.info("Successfully created template in Vertex AI.", { status: response.status });
            return response.data;
        } catch (error) {
            logger.error("Failed to create template", error);
            const { HttpsError } = require("firebase-functions/v2/https");
            throw new HttpsError('internal', 'Failed to create template', error.message);
        }
    });