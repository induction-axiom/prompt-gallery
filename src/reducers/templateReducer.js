export const initialState = {
    status: "Ready",
    templates: [],
    likedTemplateIds: [], // Store IDs of templates liked by the user
    isLoading: false,
    runResult: "",
    viewTemplateData: null
};

export const templateReducer = (state, action) => {
    switch (action.type) {
        case 'SET_STATUS':
            return { ...state, status: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_TEMPLATES':
            return { ...state, templates: action.payload };
        case 'SET_USER_LIKES':
            return { ...state, likedTemplateIds: action.payload };
        case 'SET_RUN_RESULT':
            return { ...state, runResult: action.payload };
        case 'SET_VIEW_DATA':
            return { ...state, viewTemplateData: action.payload };

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

        default:
            return state;
    }
};
