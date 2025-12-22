import { useState } from 'react';
import { runPromptTemplate } from '../services/ai';
import { extractImageFromGeminiResult, extractTextFromGeminiResult } from '../utils/geminiParsers';
import { uploadImage } from '../services/storage';
import { saveExecutionMetadata } from '../services/firestore';

export const usePromptExecution = (user) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [runResult, setRunResult] = useState("");
    const [error, setError] = useState(null);

    const executePrompt = async ({ template, inputJson, onSave }) => {
        if (!template) return;

        setIsGenerating(true);
        setRunResult("");
        setError(null);

        try {
            const reqBody = JSON.parse(inputJson);
            const templateId = template.name.split('/').pop();

            // 1. Run the prompt
            const response = await runPromptTemplate({ templateId, reqBody });
            setRunResult(response);

            // 2. Process and Save logic (only if we have a user to save to)
            if (user && onSave) {
                const imageParams = extractImageFromGeminiResult(response);

                const commonExecutionData = {
                    promptId: templateId,
                    userId: user.uid,
                    createdAt: { seconds: Date.now() / 1000 },
                    creatorId: user.uid,
                    inputVariables: reqBody,
                    public: true,
                };

                let newExecution = null;

                if (imageParams && imageParams.type === 'base64') {
                    // It's an image
                    const { storagePath, downloadURL } = await uploadImage(user.uid, templateId, imageParams.data, imageParams.mimeType);
                    const docRef = await saveExecutionMetadata({
                        templateId,
                        user,
                        storagePath,
                        downloadURL,
                        reqBody,
                        isImage: true
                    });

                    newExecution = {
                        ...commonExecutionData,
                        id: docRef.id,
                        storagePath,
                        imageUrl: downloadURL,
                        textContent: null,
                        isImage: true,
                        type: 'image'
                    };
                } else {
                    // It's text
                    const textContent = extractTextFromGeminiResult(rawResult);
                    if (textContent) {
                        const docRef = await saveExecutionMetadata({
                            templateId,
                            user,
                            storagePath: null,
                            downloadURL: null,
                            reqBody,
                            isImage: false,
                            textContent: textContent
                        });

                        newExecution = {
                            ...commonExecutionData,
                            id: docRef.id,
                            storagePath: null,
                            imageUrl: null,
                            textContent: textContent,
                            isImage: false,
                            type: 'text'
                        };
                    }
                }

                // 3. Notify parent to update global list
                if (newExecution) {
                    onSave(templateId, newExecution);
                }
            }

        } catch (err) {
            console.error(err);
            setError(err.message);
            setRunResult("Error: " + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const clearResult = () => {
        setRunResult("");
        setError(null);
    };

    return {
        isGenerating,
        runResult,
        error,
        executePrompt,
        clearResult
    };
};
