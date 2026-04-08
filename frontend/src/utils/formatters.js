/**
 * Synchronizes audit tool reference IDs based on the engagement number.
 * Example: AE-2026-004 with prefix "CC" returns "CC-2026-004"
 * 
 * @param {string} prefix - The tool prefix (e.g., "CC", "AWP", "DO")
 * @param {string} aeNumber - The source engagement number (e.g., "AE-2026-004")
 * @returns {string} The formatted reference ID
 */
export const formatRef = (prefix, aeNumber) => {
    if (!aeNumber) return prefix + "-202X-XXX";
    
    // Extract year and sequence using regex
    // Matches patterns like AE-2026-001 or just 2026-001
    const match = aeNumber.match(/(\d{4})-(\d{3,4})/);
    
    if (match) {
        return `${prefix}-${match[1]}-${match[2]}`;
    }
    
    // Fallback: If AE number is malformed, just append it to prefix or return placeholder
    return `${prefix}-${aeNumber.replace('AE-', '')}`;
};
