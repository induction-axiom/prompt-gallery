import React from 'react';
import Modal from '../common/Modal';
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from '../../firebase';
import { extractTextFromGeminiResult } from '../../utils/geminiParsers';
import { cleanJsonString } from '../../utils/jsonUtils';

const TemplateEditor = ({
    isOpen,
    isEditing,
    onClose,
    onSave,
    isLoading,
    initialData
}) => {
    const [displayName, setDisplayName] = React.useState("");
    const [dotPromptString, setDotPromptString] = React.useState("");
    const [jsonInputSchema, setJsonInputSchema] = React.useState("");
    const [isGeneratingSchema, setIsGeneratingSchema] = React.useState(false);

    // Needed for auto-detect call
    const functions = getFunctions(app);

    React.useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                setDisplayName(initialData.displayName || "");
                setDisplayName(initialData.displayName || "");
                setDotPromptString(initialData.templateString || "");
                setJsonInputSchema(initialData.jsonInputSchema || "");
            } else {
                setDisplayName("");
                setDotPromptString(`---
model: gemini-3-pro-image-preview
config:
  temperature: 0.9
input:
  schema:
    object: string
---
Create a cute, isometric miniature 3D cartoon scene of a {{object}}. The style should feature soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadows. Use a clean, minimalistic composition with a soft, solid-colored background.`);
                setJsonInputSchema("");
            }
        }
    }, [isOpen, isEditing, initialData]);

    const handleAutoDetectScore = async () => {
        if (!dotPromptString) return alert("Please enter a prompt first");
        setIsGeneratingSchema(true);
        try {
            const runFn = httpsCallable(functions, 'runPromptTemplate');
            const result = await runFn({
                templateId: '375a6ce2-efaa-4d22-bf67-4944ce8dc6ed',
                reqBody: { target_template: dotPromptString }
            });

            let parsed = extractTextFromGeminiResult(result.data);
            if (!parsed) parsed = result.data;
            parsed = cleanJsonString(parsed);

            const finalJson = (parsed === '{}' || !parsed) ? '{"object": "banana"}' : parsed;
            setJsonInputSchema(finalJson);
        } catch (error) {
            console.error("Failed to generate default input:", error);
            alert("Failed to auto-detect schema");
        } finally {
            setIsGeneratingSchema(false);
        }
    };

    const handleSave = () => {
        onSave({ displayName, dotPromptString, jsonInputSchema });
    };
    if (!isOpen) return null;

    return (
        <Modal
            title={isEditing ? "Edit Template" : "Create New Template"}
            onClose={onClose}
            footer={
                <>
                    <button onClick={onClose} className="px-5 py-2.5 text-base rounded-md border border-[#ccc] cursor-pointer transition-opacity hover:opacity-90 inline-flex items-center justify-center bg-white">Cancel</button>
                    <button onClick={handleSave} disabled={isLoading} className="px-5 py-2.5 text-base rounded-md border border-transparent cursor-pointer transition-opacity hover:opacity-90 inline-flex items-center justify-center bg-[#1890ff] text-white disabled:opacity-60 disabled:cursor-not-allowed">
                        {isLoading ? 'Saving...' : 'Save Template'}
                    </button>
                </>
            }
        >
            <div className="mb-[15px]">
                <label className="block mb-[5px] font-bold">Display Name</label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., 3D Cartoon"
                    className="w-full p-2 box-border border border-[#ddd] rounded"
                />
            </div>
            <div className="mb-[15px] flex-1 flex flex-col">
                <label className="block mb-[5px] font-bold">DotPrompt String</label>
                <textarea
                    value={dotPromptString}
                    onChange={(e) => setDotPromptString(e.target.value)}
                    className="w-full p-2 box-border border border-[#ddd] rounded resize-none font-mono h-[400px] mb-4"
                />
                <div className="flex justify-between items-center mb-[5px]">
                    <label className="font-bold">Input Schema (JSON)</label>
                    <button
                        onClick={handleAutoDetectScore}
                        disabled={isGeneratingSchema}
                        className="text-xs text-[#1890ff] hover:underline cursor-pointer disabled:opacity-50"
                    >
                        {isGeneratingSchema ? '✨ Auto-detecting...' : '✨ Auto Detect Schema'}
                    </button>
                </div>
                <textarea
                    value={jsonInputSchema}
                    onChange={(e) => setJsonInputSchema(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="w-full p-2 box-border border border-[#ddd] rounded resize-none font-mono h-[100px]"
                />
            </div>
        </Modal >
    );
};

export default TemplateEditor;
