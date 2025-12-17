import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";

const functions = getFunctions(app);

// Cache for prompt templates: templateId -> { data, timestamp }
const promptTemplateCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const getPromptTemplate = async ({ templateId }) => {
    // Check cache 
    if (promptTemplateCache.has(templateId)) {
        const { data, timestamp } = promptTemplateCache.get(templateId);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
            return data;
        }
        // Cache expired
        promptTemplateCache.delete(templateId);
    }

    const getFn = httpsCallable(functions, 'getPromptTemplate');
    const result = await getFn({ templateId });

    // Update cache
    promptTemplateCache.set(templateId, {
        data: result,
        timestamp: Date.now()
    });

    return result;
};

export const createPromptTemplate = async ({ displayName, dotPromptString, jsonInputSchema }) => {
    const createFn = httpsCallable(functions, 'createPromptTemplate');
    return await createFn({ displayName, dotPromptString, jsonInputSchema });
};

export const updatePromptTemplate = async ({ templateId, displayName, dotPromptString, jsonInputSchema }) => {
    // Invalidate cache
    promptTemplateCache.delete(templateId);

    const updateFn = httpsCallable(functions, 'updatePromptTemplate');
    return await updateFn({ templateId, displayName, dotPromptString, jsonInputSchema });
};

export const deletePromptTemplate = async ({ templateId }) => {
    // Invalidate cache
    promptTemplateCache.delete(templateId);

    const deleteFn = httpsCallable(functions, 'deletePromptTemplate');
    return await deleteFn({ templateId });
};

export const runPromptTemplate = async ({ templateId, reqBody }) => {
    const runFn = httpsCallable(functions, 'runPromptTemplate');
    return await runFn({ templateId, reqBody });
};
