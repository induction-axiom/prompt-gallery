/**
 * Checks if the template or dotprompt string indicates an image model.
 * @param {string|object} template 
 * @returns {boolean}
 */
const isImageModel = (template) => {
    if (!template) return false;

    // Handle dotprompt string directly
    if (typeof template === 'string') {
        const modelMatch = template.match(/model:\s*(.+)/i);
        const modelName = modelMatch ? modelMatch[1] : '';
        return modelName.toLowerCase().includes('image');
    }

    // Handle template object
    const modelName = template.model || template.templateData?.model || template.name || '';
    return modelName.toLowerCase().includes('image');
};

module.exports = {
    isImageModel
};
