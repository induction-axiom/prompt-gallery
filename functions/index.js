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
            // Return a clean error to the client
            throw new HttpsError('internal', 'Failed to create template', error.message);
        }
    }
);