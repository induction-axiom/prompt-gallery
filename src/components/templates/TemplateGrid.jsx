import React from 'react';
import TemplateCard from './TemplateCard';

const TemplateGrid = ({ templates, state, actions, user, likedExecutionIds }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
            {templates.map((t) => (
                <TemplateCard
                    key={t.name}
                    template={t}
                    getTemplateId={actions.getTemplateId}
                    onRun={() => actions.setSelectedRunTemplate(t)}
                    onView={() => actions.handleViewWrapper(t)}
                    onEdit={actions.handleOpenEdit}
                    onDelete={actions.handleDeleteTemplate}
                    onDeleteExecution={actions.handleDeleteExecution}
                    onToggleLike={actions.handleToggleLike}
                    onToggleExecutionLike={actions.handleToggleExecutionLike}
                    isLiked={state.likedTemplateIds.includes(actions.getTemplateId(t.name))}
                    likedExecutionIds={state.likedExecutionIds}
                    currentUser={user}
                />
            ))}
        </div>
    );
};

export default TemplateGrid;
