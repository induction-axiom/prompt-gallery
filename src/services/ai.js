import { getTemplateGenerativeModel } from "firebase/ai";
import { ai } from "../firebase";

export async function runPromptTemplate({ templateId, reqBody }) {
    const model = getTemplateGenerativeModel(ai);
    try {
        return await model.generateContent(
            templateId,
            reqBody
        );
    } catch (error) {
        console.error("Error calling template:", error);
        throw error;
    }
}