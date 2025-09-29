const FIREBASE_CONFIG = {
    databaseURL: "https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/"
};

window.FIREBASE_URL = FIREBASE_CONFIG.databaseURL;

window.firebaseGet = async function (path) {
    const response = await fetch(`${FIREBASE_URL}${path}.json`);
    return await response.json();
};

window.firebasePost = async function (path, data) {
    const response = await fetch(`${FIREBASE_URL}${path}.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await response.json();
};

window.firebasePut = async function (path, data) {
    const response = await fetch(`${FIREBASE_URL}${path}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await response.json();
};

window.firebaseDelete = async function (path) {
    const response = await fetch(`${FIREBASE_URL}${path}.json`, {
        method: 'DELETE'
    });
    return await response.json();
};