export const initialState = {
    status: "Ready",
    templates: [],
    likedTemplateIds: [], // Store IDs of templates liked by the user
    likedExecutionIds: [], // Store IDs of executions liked by the user
    isLoading: false,
    sortBy: "likeCount", // Default sort
    selectedTags: [],
    lastDoc: null,
    hasMore: true
};

export const templateReducer = (state, action) => {
    switch (action.type) {
        case 'SET_STATUS':
            return { ...state, status: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_TEMPLATES':
            return {
                ...state,
                templates: action.payload.templates,
                lastDoc: action.payload.lastDoc,
                hasMore: action.payload.hasMore
            };
        case 'SET_PAGINATION':
            return {
                ...state,
                lastDoc: action.payload.lastDoc,
                hasMore: action.payload.hasMore
            };
        case 'setQueryType':
            return { ...state, queryType: action.payload };
        case 'SET_SORT_BY':
            return { ...state, sortBy: action.payload };
        case 'SET_TAGS':
            return { ...state, selectedTags: action.payload };
        case 'SET_USER_LIKES':
            return { ...state, likedTemplateIds: action.payload };
        case 'SET_USER_EXECUTION_LIKES':
            return { ...state, likedExecutionIds: action.payload };
        // SET_VIEW_DATA Removed

        case 'TOGGLE_LIKE': {
            const { templateId, isLiked } = action.payload; // isLiked = true means we JUST liked it.

            // Update likedTemplateIds
            let newLikedIds;
            if (isLiked) {
                newLikedIds = [...state.likedTemplateIds, templateId];
            } else {
                newLikedIds = state.likedTemplateIds.filter(id => id !== templateId);
            }

            // Update likeCount in templates array
            const newTemplates = state.templates.map(t => {
                const tHeaderId = t.name.split('/').pop();
                if (tHeaderId === templateId) {
                    const currentCount = t.likeCount || 0;
                    return {
                        ...t,
                        likeCount: isLiked ? currentCount + 1 : Math.max(0, currentCount - 1)
                    };
                }
                return t;
            });

            return {
                ...state,
                likedTemplateIds: newLikedIds,
                templates: newTemplates
            };
        }

        case 'TOGGLE_EXECUTION_LIKE': {
            const { executionId, templateId, isLiked } = action.payload; // isLiked = true means we JUST liked it.

            // Update likedExecutionIds
            let newLikedIds;
            if (isLiked) {
                newLikedIds = [...state.likedExecutionIds, executionId];
            } else {
                newLikedIds = state.likedExecutionIds.filter(id => id !== executionId);
            }

            // Update likeCount in executions within the correct template
            const newTemplates = state.templates.map(t => {
                const tHeaderId = t.name.split('/').pop();
                if (tHeaderId === templateId && t.executions) {
                    const updatedExecutions = t.executions.map(e => {
                        if (e.id === executionId) {
                            const currentCount = e.likeCount || 0;
                            return {
                                ...e,
                                likeCount: isLiked ? currentCount + 1 : Math.max(0, currentCount - 1)
                            };
                        }
                        return e;
                    });
                    return { ...t, executions: updatedExecutions };
                }
                return t;
            });

            return {
                ...state,
                likedExecutionIds: newLikedIds,
                templates: newTemplates
            };
        }

        case 'DELETE_TEMPLATE':
            // Optimistic delete
            const templateIdToDelete = action.payload;
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

        case 'APPEND_TEMPLATES':
            return {
                ...state,
                templates: [...state.templates, ...action.payload]
            };
        default:
            return state;
    }
};
