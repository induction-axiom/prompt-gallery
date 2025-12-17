export const isImageModel = (template) => {
    if (!template) return false;
    const modelName = template.model || template.templateData?.model || template.name || '';
    return modelName.toLowerCase().includes('image');
};

export const extractImageFromGeminiResult = (runResult) => {
    if (!runResult || !runResult.candidates || runResult.candidates.length === 0) return null;

    const candidate = runResult.candidates[0];
    const parts = candidate.content?.parts;

    if (!parts || parts.length === 0) return null;

    // Check for inlineData (base64)
    const inlineData = parts.find(p => p.inlineData);
    if (inlineData) {
        return {
            type: 'base64',
            mimeType: inlineData.inlineData.mimeType,
            data: inlineData.inlineData.data
        };
    }

    // Check for text that might be a URL (fallback)
    const textPart = parts.find(p => p.text);
    if (textPart && textPart.text.trim().startsWith('http')) {
        return {
            type: 'url',
            url: textPart.text.trim()
        };
    }

    return null;
};
