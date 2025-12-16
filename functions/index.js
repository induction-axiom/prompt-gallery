const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleAuth } = require("google-auth-library");
const { logger } = require("firebase-functions");

// Initialize Google Auth
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
        const { displayName, dotPromptString } = request.data;
        const projectId = process.env.GCLOUD_PROJECT;
        const location = "global";
        logger.info(`Received request for Template Display Name: ${displayName}`, { dotPromptString: dotPromptString });
        const url = `https://firebasevertexai.googleapis.com/v1beta/projects/${projectId}/locations/${location}/templates`;
        try {
            const client = await auth.getClient();
            const response = await client.request({
                url: url,
                method: "POST",
                data: {
                    displayName: displayName,
                    templateString: dotPromptString
                },
            });
            logger.info("Successfully created template.", { status: response.status });
            return response.data;
        } catch (error) {
            logger.error("Failed to create template", error);
            throw new HttpsError('internal', 'Failed to create template', error.message);
        }
    }
);

exports.deletePromptTemplate = onCall(
    {
        maxInstances: 10,
        enforceAppCheck: true
    },
    async (request) => {
        logger.info("deletePromptTemplate function invoked.", { structuredData: true });
        const { templateId } = request.data;
        if (!templateId) {
            throw new HttpsError('invalid-argument', 'The function must be called with a "templateId" argument.');
        }
        const projectId = process.env.GCLOUD_PROJECT;
        const location = "global";
        logger.info(`Received request to delete Template ID: ${templateId}`);
        const url = `https://firebasevertexai.googleapis.com/v1beta/projects/${projectId}/locations/${location}/templates/${templateId}`;
        try {
            const client = await auth.getClient();
            const response = await client.request({
                url: url,
                method: "DELETE",
            });

            logger.info("Successfully deleted template.", { status: response.status });
            return response.data;

        } catch (error) {
            logger.error("Failed to delete template", error);
            throw new HttpsError('internal', 'Failed to delete template', error.message);
        }
    }
);

exports.listPromptTemplates = onCall(
    {
        maxInstances: 10,
        enforceAppCheck: true
    },
    async (request) => {
        logger.info("listPromptTemplates function invoked.", { structuredData: true });
        const projectId = process.env.GCLOUD_PROJECT;
        const location = "global";
        const url = `https://firebasevertexai.googleapis.com/v1beta/projects/${projectId}/locations/${location}/templates`;
        const data = request.data || {};
        const pageSize = data.pageSize || 50;
        const pageToken = data.pageToken || "";
        try {
            const client = await auth.getClient();
            const response = await client.request({
                url: url,
                method: "GET",
                params: { pageSize, pageToken }
            });
            logger.info("Successfully listed templates.", { status: response.status });
            return response.data;
        } catch (error) {
            logger.error("Failed to list templates", error);
            throw new HttpsError('internal', 'Failed to list templates', error.message);
        }
    }
);