export const initialState = {
    status: "Ready",
    templates: [],
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
        case 'SET_RUN_RESULT':
            return { ...state, runResult: action.payload };
        case 'SET_VIEW_DATA':
            return { ...state, viewTemplateData: action.payload };

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
