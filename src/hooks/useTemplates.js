import { useReducer, useEffect } from 'react';
import { getPromptTemplate, createPromptTemplate, updatePromptTemplate, deletePromptTemplate, runPromptTemplate } from '../services/functions';
import { extractImageFromGeminiResult, extractTextFromGeminiResult } from '../utils/geminiParsers';
import { getRecentTemplates, saveExecutionMetadata, getTemplateExecutions, deleteExecution, getUserLikes, togglePromptLike, getUserExecutionLikes, toggleExecutionLike, getUserProfile } from '../services/firestore';
import { uploadImage, deleteImage } from '../services/storage';
import { app } from "../firebase";
import { templateReducer, initialState } from '../reducers/templateReducer';

export const useTemplates = (user) => {
    const [state, dispatch] = useReducer(templateReducer, initialState);

    const getTemplateId = (fullResourceName) => fullResourceName ? fullResourceName.split('/').pop() : 'Unknown';

    // Helper dispatch wrappers
    const setStatus = (msg) => dispatch({ type: 'SET_STATUS', payload: msg });
    const setIsLoading = (loading) => dispatch({ type: 'SET_LOADING', payload: loading });
    const setRunResult = (res) => dispatch({ type: 'SET_RUN_RESULT', payload: res });

    // Fetch user likes when user logs in
    useEffect(() => {
        if (user) {
            getUserLikes(user.uid).then(likes => {
                dispatch({ type: 'SET_USER_LIKES', payload: likes });
            });
            getUserExecutionLikes(user.uid).then(likes => {
                dispatch({ type: 'SET_USER_EXECUTION_LIKES', payload: likes });
            });
        } else {
            dispatch({ type: 'SET_USER_LIKES', payload: [] });
            dispatch({ type: 'SET_USER_EXECUTION_LIKES', payload: [] });
        }
    }, [user]);

    const fetchTemplates = async (sortOverride) => {
        const currentSort = typeof sortOverride === 'string' ? sortOverride : state.sortBy;
        setStatus("Fetching list from Firestore...");
        setIsLoading(true);
        try {
            // 1. Get recent templates from Firestore
            const firestoreDocs = await getRecentTemplates(10, currentSort);

            if (firestoreDocs.length === 0) {
                dispatch({ type: 'SET_TEMPLATES', payload: [] });
                setStatus("Ready (No templates found)");
                return;
            }

            // 2. Fetch details for each template in parallel
            setStatus(`Fetching details for ${firestoreDocs.length} templates...`);

            const promises = firestoreDocs.map(async (docData) => {
                try {
                    const res = await getPromptTemplate({ templateId: docData.id });
                    let executions = [];
                    let ownerProfile = null;

                    try {
                        executions = await getTemplateExecutions(docData.id, 10);
                        if (docData.ownerId) {
                            ownerProfile = await getUserProfile(docData.ownerId);
                        }
                    } catch (e) {
                        console.error("Failed to fetch extra data for", docData.id, e);
                    }

                    return {
                        ...res.data,
                        ownerId: docData.ownerId,
                        ownerProfile: ownerProfile,
                        createdAt: docData.createdAt,
                        isImage: docData.isImage,
                        jsonInputSchema: docData.jsonInputSchema || '',
                        likeCount: docData.likeCount || 0,
                        executions: executions
                    };
                } catch (err) {
                    console.error(`Failed to fetch template ${docData.id}`, err);
                    return {
                        name: `projects/-/locations/-/templates/${docData.id}`,
                        displayName: 'Unavailable Prompt',
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

        try {
            const templateId = getTemplateId(template.name);
            const result = await getPromptTemplate({ templateId });
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

    const handleSaveTemplate = async ({ displayName, dotPromptString, jsonInputSchema, editingTemplate }) => {
        if (!displayName || !dotPromptString) return alert("Missing fields");

        setIsLoading(true);
        try {
            if (editingTemplate) {
                setStatus("Updating...");
                await updatePromptTemplate({
                    templateId: getTemplateId(editingTemplate.name),
                    displayName,
                    dotPromptString,
                    jsonInputSchema
                });
                setStatus("Prompt Updated!");
            } else {
                setStatus("Creating...");
                await createPromptTemplate({
                    displayName,
                    dotPromptString,
                    jsonInputSchema
                });
                setStatus("Prompt Created!");
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
        setStatus(`Deleting ${templateId}...`);
        setIsLoading(true);
        try {
            await deletePromptTemplate({ templateId });
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
            await deleteExecution(execution.id, templateId);
            if (execution.storagePath) {
                await deleteImage(execution.storagePath);
            }

            // Action: DELETE_EXECUTION
            dispatch({
                type: 'DELETE_EXECUTION',
                payload: { templateId, executionId: execution.id }
            });

            setStatus("Artifact deleted.");
        } catch (error) {
            console.error(error);
            alert("Failed to delete execution: " + error.message);
            setStatus("Error deleting execution");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleLike = async (templateId) => {
        if (!user) return alert("Please sign in to like templates.");

        const isLiked = !state.likedTemplateIds.includes(templateId);

        // Optimistic update
        dispatch({ type: 'TOGGLE_LIKE', payload: { templateId, isLiked } });

        try {
            await togglePromptLike(templateId, user.uid);
        } catch (error) {
            console.error("Failed to toggle like:", error);
            // Revert on error
            dispatch({ type: 'TOGGLE_LIKE', payload: { templateId, isLiked: !isLiked } });
            alert("Failed to update like status.");
        }
    };

    const handleToggleExecutionLike = async (templateId, executionId) => {
        if (!user) return alert("Please sign in to like executions.");

        const isLiked = !state.likedExecutionIds.includes(executionId);

        // Optimistic update
        dispatch({ type: 'TOGGLE_EXECUTION_LIKE', payload: { executionId, templateId, isLiked } });

        try {
            await toggleExecutionLike(executionId, user.uid);
        } catch (error) {
            console.error("Failed to toggle execution like:", error);
            // Revert on error
            dispatch({ type: 'TOGGLE_EXECUTION_LIKE', payload: { executionId, templateId, isLiked: !isLiked } });
            alert("Failed to update like status.");
        }
    };

    const handleRunTemplate = async ({ selectedRunTemplate, inputJson }) => {
        if (!selectedRunTemplate) return;
        setStatus("Running...");
        setIsLoading(true);
        setRunResult("");
        if (!selectedRunTemplate) return;
        setStatus("Running...");
        setIsLoading(true);
        setRunResult("");
        try {
            const reqBody = JSON.parse(inputJson);
            const templateId = getTemplateId(selectedRunTemplate.name);
            const result = await runPromptTemplate({ templateId, reqBody });

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

    const setSortBy = (sort) => {
        dispatch({ type: 'SET_SORT_BY', payload: sort });
        fetchTemplates(sort);
    };

    return {
        state,
        actions: {
            fetchTemplates,
            handleViewTemplate,
            handleSaveTemplate,
            handleDeleteTemplate,
            handleDeleteExecution,
            handleRunTemplate,
            handleToggleLike,
            handleToggleExecutionLike,
            clearRunResult,
            getTemplateId,
            setSortBy
        }
    };
};
