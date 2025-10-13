/**
 * Firebase configuration.
 * @type {{databaseURL: string}}
 */
const FIREBASE_CONFIG = {
    databaseURL: "https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/"
};

window.FIREBASE_URL = FIREBASE_CONFIG.databaseURL;

/**
 * GET a JSON resource from Firebase.
 * @param {string} path Path under the database root (without .json)
 * @returns {Promise<any>} Parsed JSON response
 */
window.firebaseGet = async function (path) {
    const response = await fetch(`${FIREBASE_URL}${path}.json`);
    return await response.json();
};

/**
 * POST (create) a JSON value at a Firebase path.
 * @param {string} path Path under the database root (without .json)
 * @param {any} data Data to send
 * @returns {Promise<any>} Parsed JSON response
 */
window.firebasePost = async function (path, data) {
    const response = await fetch(`${FIREBASE_URL}${path}.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await response.json();
};

/**
 * PUT (replace) a JSON value at a Firebase path.
 * @param {string} path Path under the database root (without .json)
 * @param {any} data Data to send
 * @returns {Promise<any>} Parsed JSON response
 */
window.firebasePut = async function (path, data) {
    const response = await fetch(`${FIREBASE_URL}${path}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await response.json();
};

/**
 * DELETE a JSON value at a Firebase path.
 * @param {string} path Path under the database root (without .json)
 * @returns {Promise<any>} Parsed JSON response
 */
window.firebaseDelete = async function (path) {
    const response = await fetch(`${FIREBASE_URL}${path}.json`, {
        method: 'DELETE'
    });
    return await response.json();
};