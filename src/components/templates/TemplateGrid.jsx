import React from 'react';
import TemplateCard from './TemplateCard';

const TemplateGrid = ({ templates, actions, user, state }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((t) => (
                <TemplateCard
                    key={t.name}
                    template={t}
                    getTemplateId={actions.getTemplateId}
                    onRun={() => actions.setSelectedRunTemplate(t)}
                    onView={() => actions.handleViewWrapper(t)}
                    onEdit={(e) => actions.handleOpenEdit(e, t)}
                    onDelete={actions.handleDeleteTemplate}
                    onDeleteExecution={actions.handleDeleteExecution}
                    onToggleLike={actions.handleToggleLike}
                    isLiked={state.likedTemplateIds.includes(actions.getTemplateId(t.name))}
                    currentUser={user}
                />
            ))}
        </div>
    );
};

export default TemplateGrid;
