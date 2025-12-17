import { useState } from 'react';
import { getFunctions, httpsCallable } from "firebase/functions";
import { extractImageFromGeminiResult, extractTextFromGeminiResult } from '../utils/geminiParsers';
import { getRecentTemplates, saveExecutionMetadata, getTemplateExecutions, deleteExecution } from '../services/firestore';
import { uploadImage, deleteImage } from '../services/storage';
import { app } from "../firebase";

export const useTemplates = (user) => {
    const [status, setStatus] = useState("Ready");
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [runResult, setRunResult] = useState("");
    const [viewTemplateData, setViewTemplateData] = useState(null);

    const functions = getFunctions(app);

    const getTemplateId = (fullResourceName) => fullResourceName ? fullResourceName.split('/').pop() : 'Unknown';

    const fetchTemplates = async () => {
        setStatus("Fetching list from Firestore...");
        setIsLoading(true);
        try {
            // 1. Get recent templates from Firestore
            const firestoreDocs = await getRecentTemplates(10);

            if (firestoreDocs.length === 0) {
                setTemplates([]);
                setStatus("Ready (No templates found)");
                return;
            }

            // 2. Fetch details for each template in parallel
            setStatus(`Fetching details for ${firestoreDocs.length} templates...`);
            const getFn = httpsCallable(functions, 'getPromptTemplate');

            const promises = firestoreDocs.map(async (docData) => {
                try {
                    // Fetch template details from Cloud Function
                    const res = await getFn({ templateId: docData.id });

                    // Fetch recent executions (images) from Firestore
                    let executions = [];
                    try {
                        executions = await getTemplateExecutions(docData.id, 10);
                    } catch (e) {
                        console.error("Failed to fetch executions for", docData.id, e);
                    }

                    return {
                        ...res.data,
                        ownerId: docData.ownerId,
                        createdAt: docData.createdAt,
                        isImage: docData.isImage,
                        executions: executions
                    };
                } catch (err) {
                    console.error(`Failed to fetch template ${docData.id}`, err);
                    return {
                        name: `projects/-/locations/-/templates/${docData.id}`,
                        displayName: 'Unavailable Template',
                        description: `Could not load details: ${err.message}`,
                        error: true,
                        ownerId: docData.ownerId,
                        executions: []
                    };
                }
            });

            const results = await Promise.all(promises);
            setTemplates(results);
            setStatus("Ready");
        } catch (error) {
            console.error(error);
            setStatus("Fetch Error: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewTemplate = async (template) => {
        setStatus("Fetching details...");
        setIsLoading(true);
        setViewTemplateData(null);
        // Note: Caller is responsible for opening the modal

        const getFn = httpsCallable(functions, 'getPromptTemplate');
        try {
            const templateId = getTemplateId(template.name);
            const result = await getFn({ templateId });
            setViewTemplateData(result.data);
            setStatus("Details loaded");
        } catch (error) {
            console.error(error);
            setViewTemplateData({ error: error.message });
            setStatus("Error loading details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTemplate = async ({ displayName, dotPromptString, editingTemplate }) => {
        if (!displayName || !dotPromptString) return alert("Missing fields");

        setIsLoading(true);
        try {
            if (editingTemplate) {
                setStatus("Updating...");
                const updateFn = httpsCallable(functions, 'updatePromptTemplate');
                await updateFn({
                    templateId: getTemplateId(editingTemplate.name),
                    displayName,
                    dotPromptString
                });
                setStatus("Template Updated!");
            } else {
                setStatus("Creating...");
                const createFn = httpsCallable(functions, 'createPromptTemplate');
                await createFn({
                    displayName,
                    dotPromptString
                });
                setStatus("Template Created!");
            }

            // Caller should handle closing editor
            fetchTemplates();
        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTemplate = async (e, fullResourceName) => {
        e.stopPropagation();
        const templateId = getTemplateId(fullResourceName);
        if (!window.confirm(`Delete "${templateId}"?`)) return;

        setStatus(`Deleting ${templateId}...`);
        setIsLoading(true);
        const deleteFn = httpsCallable(functions, 'deletePromptTemplate');
        try {
            await deleteFn({ templateId });
            setStatus("Deleted.");
            fetchTemplates();
        } catch (error) {
            alert("Delete Error: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteExecution = async (templateId, execution) => {
        if (!window.confirm("Delete this execution result? This cannot be undone.")) return;
        setStatus("Deleting execution...");
        setIsLoading(true);
        try {
            // 1. Delete from Firestore
            await deleteExecution(execution.id);

            // 2. Delete image from Storage (if applicable)
            if (execution.storagePath) {
                await deleteImage(execution.storagePath);
            }

            // 3. Update local state
            setTemplates(prev => prev.map(t => {
                if (getTemplateId(t.name) === templateId) {
                    return {
                        ...t,
                        executions: t.executions.filter(e => e.id !== execution.id)
                    };
                }
                return t;
            }));

            setStatus("Execution deleted.");
        } catch (error) {
            console.error(error);
            alert("Failed to delete execution: " + error.message);
            setStatus("Error deleting execution");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunTemplate = async ({ selectedRunTemplate, inputJson }) => {
        if (!selectedRunTemplate) return;
        setStatus("Running...");
        setIsLoading(true);
        setRunResult("");
        const runFn = httpsCallable(functions, 'runPromptTemplate');
        try {
            const reqBody = JSON.parse(inputJson);
            const templateId = getTemplateId(selectedRunTemplate.name);
            const result = await runFn({ templateId, reqBody });

            setRunResult(result.data);

            // Auto-save generated images if detected
            const imageParams = extractImageFromGeminiResult(result.data);

            if (imageParams) {
                if (imageParams.type === 'base64') {
                    try {
                        // Upload to Storage
                        const { storagePath, downloadURL } = await uploadImage(user.uid, templateId, imageParams.data, imageParams.mimeType);

                        // Save Metadata to Firestore
                        const docRef = await saveExecutionMetadata({
                            templateId,
                            user,
                            storagePath,
                            downloadURL,
                            reqBody,
                            isImage: true
                        });
                        console.log("Image saved successfully");

                        // Update local state
                        const newExecution = {
                            id: docRef.id,
                            promptId: templateId,
                            userId: user.uid,
                            createdAt: { seconds: Date.now() / 1000 },
                            storagePath,
                            imageUrl: downloadURL,
                            textContent: null,
                            creatorId: user.uid,
                            inputVariables: reqBody,
                            public: true,
                            isImage: true,
                            type: 'image'
                        };

                        setTemplates(prev => prev.map(t => {
                            if (getTemplateId(t.name) === templateId) {
                                return {
                                    ...t,
                                    executions: [newExecution, ...(t.executions || [])]
                                };
                            }
                            return t;
                        }));

                    } catch (err) {
                        console.error("Failed to save image:", err);
                    }
                }
            } else {
                const textContent = extractTextFromGeminiResult(result.data);
                if (textContent) {
                    try {
                        const docRef = await saveExecutionMetadata({
                            templateId,
                            user,
                            storagePath: null,
                            downloadURL: null,
                            reqBody,
                            isImage: false,
                            textContent: textContent
                        });
                        console.log("Text execution saved successfully");

                        // Update local state
                        const newExecution = {
                            id: docRef.id,
                            promptId: templateId,
                            userId: user.uid,
                            createdAt: { seconds: Date.now() / 1000 },
                            storagePath: null,
                            imageUrl: null,
                            textContent: textContent,
                            creatorId: user.uid,
                            inputVariables: reqBody,
                            public: true,
                            isImage: false,
                            type: 'text'
                        };

                        setTemplates(prev => prev.map(t => {
                            if (getTemplateId(t.name) === templateId) {
                                return {
                                    ...t,
                                    executions: [newExecution, ...(t.executions || [])]
                                };
                            }
                            return t;
                        }));

                    } catch (err) {
                        console.error("Failed to save text execution:", err);
                    }
                }
            }


            setStatus("Run Complete");
        } catch (error) {
            setRunResult("Error: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const clearRunResult = () => setRunResult("");

    return {
        state: {
            templates,
            isLoading,
            status,
            runResult,
            viewTemplateData
        },
        actions: {
            fetchTemplates,
            handleViewTemplate,
            handleSaveTemplate,
            handleDeleteTemplate,
            handleDeleteExecution,
            handleRunTemplate,
            clearRunResult,
            getTemplateId
        }
    };
};
