import { useReducer } from 'react';
import { getFunctions, httpsCallable } from "firebase/functions";
import { extractImageFromGeminiResult, extractTextFromGeminiResult } from '../utils/geminiParsers';
import { getRecentTemplates, saveExecutionMetadata, getTemplateExecutions, deleteExecution } from '../services/firestore';
import { uploadImage, deleteImage } from '../services/storage';
import { app } from "../firebase";

// --- Reducer & Initial State ---

const initialState = {
    status: "Ready",
    templates: [],
    isLoading: false,
    runResult: "",
    viewTemplateData: null
};

const templateReducer = (state, action) => {
    switch (action.type) {
        case 'SET_STATUS':
            return { ...state, status: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_TEMPLATES':
            return { ...state, templates: action.payload };
        case 'SET_RUN_RESULT':
            return { ...state, runResult: action.payload };
        case 'SET_VIEW_DATA':
            return { ...state, viewTemplateData: action.payload };

        case 'DELETE_TEMPLATE':
            // This case is for optimistic deletion. The current handleDeleteTemplate re-fetches all templates,
            // so this might not be strictly necessary for the current flow but is included for completeness.
            const templateIdToDelete = action.payload; // Assuming payload is the templateId
            return {
                ...state,
                templates: state.templates.filter(t => {
                    const nameParts = t.name.split('/');
                    const currentTemplateId = nameParts[nameParts.length - 1];
                    return currentTemplateId !== templateIdToDelete;
                })
            };

        case 'DELETE_EXECUTION':
            const { templateId, executionId } = action.payload;
            return {
                ...state,
                templates: state.templates.map(t => {
                    const nameParts = t.name.split('/');
                    const currentTemplateId = nameParts[nameParts.length - 1];
                    if (currentTemplateId === templateId) {
                        return {
                            ...t,
                            executions: t.executions.filter(e => e.id !== executionId)
                        };
                    }
                    return t;
                })
            };

        case 'ADD_EXECUTION':
            const { templateId: targetTid, newExecution } = action.payload;
            return {
                ...state,
                templates: state.templates.map(t => {
                    const nameParts = t.name.split('/');
                    const currentTemplateId = nameParts[nameParts.length - 1];
                    if (currentTemplateId === targetTid) {
                        return {
                            ...t,
                            executions: [newExecution, ...(t.executions || [])]
                        };
                    }
                    return t;
                })
            };

        default:
            return state;
    }
};

export const useTemplates = (user) => {
    const [state, dispatch] = useReducer(templateReducer, initialState);
    const functions = getFunctions(app);

    const getTemplateId = (fullResourceName) => fullResourceName ? fullResourceName.split('/').pop() : 'Unknown';

    // Helper dispatch wrappers
    const setStatus = (msg) => dispatch({ type: 'SET_STATUS', payload: msg });
    const setIsLoading = (loading) => dispatch({ type: 'SET_LOADING', payload: loading });
    const setRunResult = (res) => dispatch({ type: 'SET_RUN_RESULT', payload: res });

    const fetchTemplates = async () => {
        setStatus("Fetching list from Firestore...");
        setIsLoading(true);
        try {
            // 1. Get recent templates from Firestore
            const firestoreDocs = await getRecentTemplates(10);

            if (firestoreDocs.length === 0) {
                dispatch({ type: 'SET_TEMPLATES', payload: [] });
                setStatus("Ready (No templates found)");
                return;
            }

            // 2. Fetch details for each template in parallel
            setStatus(`Fetching details for ${firestoreDocs.length} templates...`);
            const getFn = httpsCallable(functions, 'getPromptTemplate');

            const promises = firestoreDocs.map(async (docData) => {
                try {
                    const res = await getFn({ templateId: docData.id });
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
            dispatch({ type: 'SET_TEMPLATES', payload: results });
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
        dispatch({ type: 'SET_VIEW_DATA', payload: null });

        const getFn = httpsCallable(functions, 'getPromptTemplate');
        try {
            const templateId = getTemplateId(template.name);
            const result = await getFn({ templateId });
            dispatch({ type: 'SET_VIEW_DATA', payload: result.data });
            setStatus("Details loaded");
        } catch (error) {
            console.error(error);
            dispatch({ type: 'SET_VIEW_DATA', payload: { error: error.message } });
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
            // Optimistic update (optional, as fetchTemplates() will refresh)
            // dispatch({ type: 'DELETE_TEMPLATE', payload: templateId });
            fetchTemplates(); // Re-fetch to ensure state is fully consistent
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
            await deleteExecution(execution.id);
            if (execution.storagePath) {
                await deleteImage(execution.storagePath);
            }

            // Action: DELETE_EXECUTION
            dispatch({
                type: 'DELETE_EXECUTION',
                payload: { templateId, executionId: execution.id }
            });

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

            const imageParams = extractImageFromGeminiResult(result.data);
            const commonExecutionData = {
                promptId: templateId,
                userId: user.uid,
                createdAt: { seconds: Date.now() / 1000 },
                creatorId: user.uid,
                inputVariables: reqBody,
                public: true,
            };

            if (imageParams && imageParams.type === 'base64') {
                try {
                    const { storagePath, downloadURL } = await uploadImage(user.uid, templateId, imageParams.data, imageParams.mimeType);
                    const docRef = await saveExecutionMetadata({
                        templateId,
                        user,
                        storagePath,
                        downloadURL,
                        reqBody,
                        isImage: true
                    });
                    console.log("Image saved successfully");

                    const newExecution = {
                        ...commonExecutionData,
                        id: docRef.id,
                        storagePath,
                        imageUrl: downloadURL,
                        textContent: null,
                        isImage: true,
                        type: 'image'
                    };

                    dispatch({ type: 'ADD_EXECUTION', payload: { templateId, newExecution } });

                } catch (err) {
                    console.error("Failed to save image:", err);
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

                        const newExecution = {
                            ...commonExecutionData,
                            id: docRef.id,
                            storagePath: null,
                            imageUrl: null,
                            textContent: textContent,
                            isImage: false,
                            type: 'text'
                        };

                        dispatch({ type: 'ADD_EXECUTION', payload: { templateId, newExecution } });

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
        state,
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
