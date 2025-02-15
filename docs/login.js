import { CookieStorage } from "./lib/browser-utils.js";


const login_button = document.getElementById('login-button');
login_button.addEventListener('click', authenticate);

export function setupLogin(allow=false) {
    if (allow) {
        login_button.style.display = 'block';  
    } else {
        login_button.style.display = 'none';
    }
}

// Neo4J authentication
export function authenticate() {
    const dialog = document.getElementById('authentication-dialog');
    const form = dialog.querySelector('form');
    
    // Cancel button
    dialog.querySelector('.cancel-button')
        .addEventListener('click', () => dialog.close());

    // Handle form submission
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        dialog.close();
        
        // save credentials in cookies and reload the page
        const cookieStorage = new CookieStorage();
        const { endpoint, database, username, password } = form.elements;
        cookieStorage.set('mpilhlt_neo4j_credentials', {
            endpoint: endpoint.value,
            database: database.value,
            username: username.value,
            password: btoa(password.value)
        });
        document.location.reload();
    });
    dialog.showModal();
}

// Non-blocking alert()
export function showUserMessage(title, message) {
    const userMessage = document.getElementById('userMessage');
    userMessage.showModal();
    userMessage.querySelector('.dialog-header').textContent = title;
    userMessage.querySelector('.dialog-content').textContent = message;
}