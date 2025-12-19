import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { runPromptTemplate, createPromptTemplate, updatePromptTemplate } from '../../services/functions';
import { extractTextFromGeminiResult } from '../../utils/geminiParsers';
import { cleanJsonString } from '../../utils/jsonUtils';
import { SYSTEM_PROMPT_IDS } from '../../config/systemPrompts';
import { useTemplatesContext } from '../../context/TemplatesContext';

// Helper
const getTemplateId = (fullResourceName) => fullResourceName ? fullResourceName.split('/').pop() : 'Unknown';

const TemplateEditor = ({
    isOpen,
    isEditing,
    onClose,
    initialData
}) => {
    // Consume context for refreshing list
    const { actions } = useTemplatesContext();

    const [displayName, setDisplayName] = React.useState("");
    const [dotPromptString, setDotPromptString] = React.useState("");
    const [jsonInputSchema, setJsonInputSchema] = React.useState("");
    const [tags, setTags] = React.useState([]);
    const [tagsInput, setTagsInput] = React.useState("");

    // Local loading states
    const [isSaving, setIsSaving] = React.useState(false);
    const [isGeneratingSchema, setIsGeneratingSchema] = React.useState(false);
    const [isGeneratingName, setIsGeneratingName] = React.useState(false);
    const [isFormatting, setIsFormatting] = React.useState(false);
    const [isLabeling, setIsLabeling] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            console.log("TemplateEditor: isOpen", isOpen, "initialData", initialData);
            if (initialData) {
                setDisplayName(initialData.displayName || "");
                setDotPromptString(initialData.templateString || initialData.dotPromptString || "");
                setJsonInputSchema(initialData.jsonInputSchema || "");
                setTags(initialData.tags || []);
                setTagsInput((initialData.tags || []).join(", "));
            } else {
                setDisplayName("");
                setDotPromptString("");
                setJsonInputSchema("");
                setTags([]);
                setTagsInput("");
            }
        }
    }, [isOpen, initialData]);

    const handleAutoDetectScore = async () => {
        if (!dotPromptString) return alert("Please enter a prompt first");
        setIsGeneratingSchema(true);
        try {
            const result = await runPromptTemplate({
                templateId: SYSTEM_PROMPT_IDS.AUTO_DETECT_SCHEMA,
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

    const handleAutoGenerateName = async () => {
        if (!dotPromptString) return alert("Please enter a prompt first to generate a name");
        setIsGeneratingName(true);
        try {
            const result = await runPromptTemplate({
                templateId: SYSTEM_PROMPT_IDS.AUTO_GENERATE_NAME,
                reqBody: { target_template: dotPromptString }
            });

            const title = extractTextFromGeminiResult(result.data);
            if (title) {
                setDisplayName(title.trim());
            } else {
                alert("Could not generate a title");
            }
        } catch (error) {
            console.error("Failed to generate name:", error);
            alert("Failed to generate name");
        } finally {
            setIsGeneratingName(false);
        }
    };

    const handleAutoFormat = async () => {
        if (!dotPromptString) return alert("Please enter a prompt first to format");
        setIsFormatting(true);
        try {
            const result = await runPromptTemplate({
                templateId: SYSTEM_PROMPT_IDS.AUTO_FORMAT_PROMPT,
                reqBody: { rawInput: dotPromptString }
            });

            const formatted = extractTextFromGeminiResult(result.data);
            if (formatted) {
                setDotPromptString(formatted);
            } else {
                alert("Could not format prompt");
            }
        } catch (error) {
            console.error("Failed to format prompt:", error);
            alert("Failed to format prompt");
        } finally {
            setIsFormatting(false);
        }
    };

    const handleAutoLabel = async () => {
        if (!dotPromptString || !displayName) return alert("Please enter a name and prompt first");
        setIsLabeling(true);
        try {
            const result = await runPromptTemplate({
                templateId: SYSTEM_PROMPT_IDS.PROMPT_LABELER,
                reqBody: {
                    target_display_name: displayName,
                    target_template_string: dotPromptString
                }
            });

            let parsed = extractTextFromGeminiResult(result.data);
            if (!parsed) parsed = result.data;
            parsed = cleanJsonString(parsed);

            // Expecting ["Label1", "Label2"]
            try {
                const tagsArray = JSON.parse(parsed);
                let finalTags = [];
                if (Array.isArray(tagsArray)) {
                    finalTags = tagsArray;
                } else if (tagsArray.labels && Array.isArray(tagsArray.labels)) {
                    // Handle case where it returns { labels: [...] }
                    finalTags = tagsArray.labels;
                } else {
                    alert("Received unexpected format for labels");
                }

                if (finalTags.length > 0) {
                    setTags(finalTags);
                    setTagsInput(finalTags.join(", "));
                }
            } catch (e) {
                console.error("Failed to parse labels JSON", e);
                alert("Failed to parse generated labels");
            }

        } catch (error) {
            console.error("Failed to auto-label:", error);
            alert("Failed to auto-label");
        } finally {
            setIsLabeling(false);
        }
    };

    const handleSave = async () => {
        if (!displayName || !dotPromptString) return alert("Missing fields");

        // Parse tags from input
        const finalTags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);

        setIsSaving(true);
        try {
            if (isEditing && initialData) {
                await updatePromptTemplate({
                    templateId: getTemplateId(initialData.name),
                    displayName,
                    dotPromptString,
                    jsonInputSchema,
                    tags: finalTags
                });

                // Optimistic update
                actions.updateLocalTemplate({
                    ...initialData,
                    displayName,
                    templateString: dotPromptString,
                    jsonInputSchema,
                    tags: finalTags
                });
            } else {
                const isRemixing = !isEditing && initialData;
                await createPromptTemplate({
                    displayName,
                    dotPromptString,
                    jsonInputSchema,
                    tags: finalTags,
                    parentId: isRemixing ? getTemplateId(initialData.name) : null, // Function might ignore this if not updated
                    remixMetadata: isRemixing ? {
                        originName: initialData.displayName,
                        originAuthor: initialData.ownerProfile?.displayName || 'Unknown Author',
                        originAuthorId: initialData.ownerId,
                        originId: getTemplateId(initialData.name)
                    } : null
                });
                // Only refresh list for new creations since we don't have the ID/Timestamp
                actions.fetchTemplates();
            }

            onClose();
        } catch (error) {
            console.error(error);
            alert("Error saving: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            title={isEditing ? "Edit Prompt" : "Upload New Prompt"}
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Prompt'}
                    </Button>
                </>
            }
        >
            <div className="mb-4">
                {/* Remix Info Banner */}
                {(!isEditing && initialData) && (
                    <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>
                            Remixing <strong>{initialData.displayName}</strong> by {initialData.ownerProfile?.displayName || 'Unknown Author'}
                        </span>
                    </div>
                )}
                <div className="flex justify-between items-center mb-1.5">
                    <label className="block font-bold text-gray-700 dark:text-gray-300">Prompt Name</label>
                    <Button
                        variant="ghost"
                        onClick={handleAutoGenerateName}
                        disabled={isGeneratingName}
                        className="!px-3 !py-1 text-xs"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        }
                    >
                        {isGeneratingName ? 'Generating...' : 'Auto Generate Name'}
                    </Button>
                </div>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Add a name for this prompt"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 dark:text-gray-100"
                />
            </div>
            <div className="mb-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-1.5">
                    <label className="block font-bold text-gray-700 dark:text-gray-300">DotPrompt String</label>
                    <Button
                        variant="ghost"
                        onClick={handleAutoFormat}
                        disabled={isFormatting}
                        className="!px-3 !py-1 text-xs"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        }
                    >
                        {isFormatting ? 'Formatting...' : 'Auto Format'}
                    </Button>
                </div>
                <textarea
                    value={dotPromptString}
                    onChange={(e) => setDotPromptString(e.target.value)}
                    placeholder="Format your prompt using dotprompt syntax"
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg resize-none font-mono text-sm h-[400px] mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 dark:text-gray-100"
                />
                <div className="flex justify-between items-center mb-2">
                    <label className="font-bold text-gray-700 dark:text-gray-300">Input Variables (JSON)</label>
                    <Button
                        variant="ghost"
                        onClick={handleAutoDetectScore}
                        disabled={isGeneratingSchema}
                        className="!px-3 !py-1 text-xs"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        }
                    >
                        {isGeneratingSchema ? 'Auto-detecting...' : 'Auto Detect Schema'}
                    </Button>
                </div>
                <textarea
                    value={jsonInputSchema}
                    onChange={(e) => setJsonInputSchema(e.target.value)}
                    placeholder={'e.g. { "topic": "" }\nProvide a scaffold JSON so users can easily start with the correct structure.'}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg resize-none font-mono text-sm h-[100px] mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 dark:text-gray-100"
                />

                <div className="flex justify-between items-center mb-1.5">
                    <label className="block font-bold text-gray-700 dark:text-gray-300">Tags</label>
                    <Button
                        variant="ghost"
                        onClick={handleAutoLabel}
                        disabled={isLabeling}
                        className="!px-3 !py-1 text-xs"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                        }
                    >
                        {isLabeling ? 'Labeling...' : 'Auto Label'}
                    </Button>
                </div>
                <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. Image, Sci-Fi, Creative (comma separated)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 dark:text-gray-100"
                />
            </div>
        </Modal >
    );
};

export default TemplateEditor;
