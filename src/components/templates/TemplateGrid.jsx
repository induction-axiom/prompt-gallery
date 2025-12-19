import React, { useRef, useEffect } from 'react';
import TemplateCard from './TemplateCard';
import { useTemplatesContext } from '../../context/TemplatesContext';

const TemplateGrid = ({ handleViewWrapper, handleOpenEdit, handleRemix, setSelectedRunTemplate }) => {
    const { state, actions, user } = useTemplatesContext();
    const observerTarget = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && state.hasMore) {
                    actions.loadMoreTemplates();
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [state.hasMore, actions]);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 pb-8">
                {state.templates.map((t) => (
                    <TemplateCard
                        key={t.name}
                        template={t}
                        getTemplateId={actions.getTemplateId}
                        onRun={() => setSelectedRunTemplate(t)}
                        onView={() => handleViewWrapper(t)}
                        onEdit={handleOpenEdit}
                        onRemix={handleRemix}
                        onDelete={actions.handleDeleteTemplate}
                        onDeleteExecution={actions.handleDeleteExecution}
                        onToggleLike={actions.handleToggleLike}
                        onToggleExecutionLike={actions.handleToggleExecutionLike}
                        isLiked={state.likedTemplateIds.includes(actions.getTemplateId(t.name))}
                        likedExecutionIds={state.likedExecutionIds}
                        currentUser={user}
                        onAuthorClick={actions.setAuthorFilter}
                    />
                ))}
            </div>

            {/* Infinite Scroll Sentinel & Loading Indicator */}
            <div ref={observerTarget} className="h-10 w-full flex justify-center items-center my-4">
                {state.isLoading && state.templates.length > 0 && (
                    <div className="flex items-center space-x-2 text-gray-500">
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading more...</span>
                    </div>
                )}
                {!state.hasMore && state.templates.length > 0 && (
                    <span className="text-gray-400 text-sm">No more templates</span>
                )}
            </div>
        </>
    );
};

export default TemplateGrid;
