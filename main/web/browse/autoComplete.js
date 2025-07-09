// ao3AutocompleteService.js
// Service for fetching autocomplete suggestions from AO3

const AO3_BASE_URL = 'https://archiveofourown.org/autocomplete';

/**
 * Fetch autocomplete suggestions from AO3
 * @param {string} type - Type of autocomplete (character, relationship, freeform, fandom)
 * @param {string} term - Search term
 * @returns {Promise<Array>} Array of suggestion objects with id and name
 */
const fetchAutocompleteSuggestions = async (type, term) => {
    if (!term || term.length < 2) {
        return [];
    }

    const validTypes = ['character', 'relationship', 'freeform', 'fandom'];
    if (!validTypes.includes(type)) {
        console.error(`Invalid autocomplete type: ${type}`);
        return [];
    }

    try {
        const url = `${AO3_BASE_URL}/${type}?term=${encodeURIComponent(term)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Ensure we return an array of objects with id and name properties
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`Error fetching ${type} autocomplete:`, error);
        return [];
    }
};

/**
 * Fetch character suggestions
 * @param {string} term - Character name to search for
 * @returns {Promise<Array>} Array of character suggestions
 */
export const fetchCharacterSuggestions = (term) => {
    return fetchAutocompleteSuggestions('character', term);
};

/**
 * Fetch relationship suggestions
 * @param {string} term - Relationship to search for
 * @returns {Promise<Array>} Array of relationship suggestions
 */
export const fetchRelationshipSuggestions = (term) => {
    return fetchAutocompleteSuggestions('relationship', term);
};

/**
 * Fetch freeform tag suggestions
 * @param {string} term - Tag to search for
 * @returns {Promise<Array>} Array of freeform tag suggestions
 */
export const fetchFreeformSuggestions = (term) => {
    return fetchAutocompleteSuggestions('freeform', term);
};

/**
 * Fetch fandom suggestions
 * @param {string} term - Fandom to search for
 * @returns {Promise<Array>} Array of fandom suggestions
 */
export const fetchFandomSuggestions = (term) => {
    return fetchAutocompleteSuggestions('fandom', term);
};

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

/**
 * Parse comma-separated input and return last incomplete term
 * @param {string} input - User input string
 * @returns {Object} Object with fullInput and lastTerm
 */
export const parseInputForAutocomplete = (input) => {
    const trimmed = input.trim();
    const lastCommaIndex = trimmed.lastIndexOf(',');

    if (lastCommaIndex === -1) {
        return {
            fullInput: trimmed,
            lastTerm: trimmed,
            prefix: ''
        };
    }

    const prefix = trimmed.substring(0, lastCommaIndex + 1).trim();
    const lastTerm = trimmed.substring(lastCommaIndex + 1).trim();

    return {
        fullInput: trimmed,
        lastTerm,
        prefix: prefix ? prefix + ' ' : ''
    };
};

/**
 * Replace the last term in comma-separated input with selected suggestion
 * @param {string} input - Current input value
 * @param {string} suggestion - Selected suggestion
 * @returns {string} Updated input value
 */
export const replaceLastTerm = (input, suggestion) => {
    const { prefix } = parseInputForAutocomplete(input);
    return prefix + suggestion;
};

export default {
    fetchCharacterSuggestions,
    fetchRelationshipSuggestions,
    fetchFreeformSuggestions,
    fetchFandomSuggestions,
    debounce,
    parseInputForAutocomplete,
    replaceLastTerm
};