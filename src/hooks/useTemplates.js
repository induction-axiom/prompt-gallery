import { useReducer, useEffect, useRef } from 'react';
import { getPromptTemplate } from '../services/functions';
import { getRecentTemplates, getTemplateExecutions, deleteExecution, getUserLikes, togglePromptLike, getUserExecutionLikes, toggleExecutionLike, getUserProfile } from '../services/firestore';
import { deleteImage } from '../services/storage';
import { templateReducer, initialState } from '../reducers/templateReducer';
import { deletePromptTemplate } from '../services/functions';

export const useTemplates = (user) => {
    const [state, dispatch] = useReducer(templateReducer, initialState);

    const getTemplateId = (fullResourceName) => fullResourceName ? fullResourceName.split('/').pop() : 'Unknown';

    // Helper dispatch wrappers
    const setStatus = (msg) => dispatch({ type: 'SET_STATUS', payload: msg });
    const setIsLoading = (loading) => dispatch({ type: 'SET_LOADING', payload: loading });

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

    // Ref to store the current abort controller
    const abortControllerRef = useRef(null);

    const fetchTemplates = async (sortOverride) => {
        // Cancel previous request if it exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const currentSort = typeof sortOverride === 'string' ? sortOverride : state.sortBy;
        setStatus("Fetching list from Firestore...");
        setIsLoading(true);
        try {
            // 1. Get recent templates from Firestore
            const { templates: firestoreDocs, lastDoc } = await getRecentTemplates(6, currentSort); // Initial load 6

            if (signal.aborted) return;

            if (firestoreDocs.length === 0) {
                dispatch({ type: 'SET_TEMPLATES', payload: { templates: [], lastDoc: null, hasMore: false } });
                setStatus("Ready (No templates found)");
                return;
            }

            // 2. Fetch details for each template in parallel
            setStatus(`Fetching details for ${firestoreDocs.length} templates...`);

            const promises = firestoreDocs.map(async (docData) => {
                try {
                    const res = await getPromptTemplate({ templateId: docData.id });
                    if (signal.aborted) return null;

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
                        tags: docData.tags || [],
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
            if (signal.aborted) return;

            // Filter out any nulls from aborted mid-flight optimization
            const validResults = results.filter(r => r !== null);

            dispatch({ type: 'SET_TEMPLATES', payload: { templates: validResults, lastDoc, hasMore: !!lastDoc } });
            setStatus("Ready");
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Fetch aborted');
            } else {
                console.error(error);
                setStatus("Fetch Error: " + error.message);
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    };

    const loadMoreTemplates = async () => {
        if (!state.hasMore || state.isLoading) return;

        setStatus("Loading more...");
        setIsLoading(true);

        try {
            // 1. Get next batch of templates from Firestore
            const { templates: firestoreDocs, lastDoc } = await getRecentTemplates(6, state.sortBy, state.lastDoc);

            if (firestoreDocs.length === 0) {
                dispatch({ type: 'SET_PAGINATION', payload: { lastDoc: null, hasMore: false } });
                setStatus("Ready");
                return;
            }

            // 2. Fetch details for new templates
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
                        tags: docData.tags || [],
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
            dispatch({ type: 'APPEND_TEMPLATES', payload: results });
            dispatch({ type: 'SET_PAGINATION', payload: { lastDoc, hasMore: !!lastDoc } });
            setStatus("Ready");

        } catch (error) {
            console.log(error);
            setStatus("Fetch Error: " + error.message);
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
        try {
            await deletePromptTemplate({ templateId });
            setStatus("Deleted.");
            fetchTemplates();
        } catch (error) {
            alert("Delete Error: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteExecution = async (templateId, execution) => {
        if (!window.confirm("Delete this creation? This cannot be undone.")) return;
        setStatus("Deleting creation...");
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

            setStatus("Creation deleted.");
        } catch (error) {
            console.error(error);
            alert("Failed to delete creation: " + error.message);
            setStatus("Error deleting creation");
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
        if (!user) return alert("Please sign in to like creations.");

        const isLiked = !state.likedExecutionIds.includes(executionId);

        // Optimistic update
        dispatch({ type: 'TOGGLE_EXECUTION_LIKE', payload: { executionId, templateId, isLiked } });

        try {
            await toggleExecutionLike(executionId, user.uid);
        } catch (error) {
            console.error("Failed to toggle creation like:", error);
            // Revert on error
            dispatch({ type: 'TOGGLE_EXECUTION_LIKE', payload: { executionId, templateId, isLiked: !isLiked } });
            alert("Failed to update like status.");
        }
    };

    const handleSaveExecution = (templateId, newExecution) => {
        dispatch({ type: 'ADD_EXECUTION', payload: { templateId, newExecution } });
    };

    const setSortBy = (sort) => {
        dispatch({ type: 'SET_SORT_BY', payload: sort });
        fetchTemplates(sort);
    };

    return {
        state,
        actions: {
            fetchTemplates,
            handleDeleteTemplate,
            handleDeleteExecution,
            handleToggleLike,
            handleToggleExecutionLike,
            handleSaveExecution,
            getTemplateId,
            setSortBy,
            loadMoreTemplates
        }
    };
};
