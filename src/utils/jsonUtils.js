/**
 * Cleans a string of markdown code blocks and attempts to pretty-print it as JSON.
 * If the input is an object, it stringifies it.
 * If the input is invalid JSON, it returns the cleaned string.
 * @param {string|object} input 
 * @returns {string}
 */
export const cleanJsonString = (input) => {
    if (!input && input !== '') return '{}';

    if (typeof input === 'object') {
        return JSON.stringify(input, null, 2);
    }

    // Remove markdown code blocks (e.g. ```json ... ```)
    const cleaned = input.replace(/```json\n?|\n?```/g, '').trim();

    try {
        const obj = JSON.parse(cleaned);
        return JSON.stringify(obj, null, 2);
    } catch (e) {
        return cleaned;
    }
};
