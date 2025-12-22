import { model } from "../firebase";

export async function runPromptTemplate({ templateId, reqBody }) {
    try {
        return await model.generateContent(
            templateId,
            reqBody
        ).then((result) => {
            return result.response;
        });
    } catch (error) {
        console.error("Error calling template:", error);
        throw error;
    }
}