/**
 * Return a stable avatar color for a name.
 * The same contact always gets the same color after reloads and API requests.
 * @param {string} name Full name
 * @returns {"red"|"blue"|"green"|"purple"|"orange"|"pink"}
 */
function getAvatarColor(name) {
    const colors = ['red', 'blue', 'green', 'purple', 'orange', 'pink'];
    const normalized = String(name || '').trim().toLowerCase();
    let hash = 0;

    for (const char of normalized) {
        hash = ((hash * 31) + char.codePointAt(0)) >>> 0;
    }

    return colors[hash % colors.length];
}

/**
 * Get the CSS class for the stable avatar color.
 * @param {string} name Full name
 * @returns {string} CSS class name
 */
function getAvatarClass(name) {
    return `profile-badge-${getAvatarColor(name)}`;
};

/**
 * Compute user initials from a full name.
 * @param {string} name Full name
 * @returns {string} Initials in uppercase
 */
function getInitials(name) {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    } else {
        return words[0].substring(0, 2).toUpperCase();
    }
};
