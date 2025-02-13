
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
    const authDialog = document.getElementById('authentication-dialog');
    const cancelButton = authDialog.getElementsByClassName('cancel-button')[0];
    const authForm = document.getElementById('authForm');

    const cookieStorage = new CookieStorage();

    // Use demo data if the user cancels the dialog
    cancelButton.addEventListener('click', () => {
        cookieStorage.remove('mpilhlt_neo4j_credentials');
        authDialog.close();
        initWithDemoData();
    });

    // Handle form submission
    authForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        authDialog.close();
        const endpoint = document.getElementById('endpoint').value;
        const database = document.getElementById('database').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // save credentials in cookies
        cookieStorage.set('mpilhlt_neo4j_credentials', {
            endpoint,
            database,
            username,
            password: btoa(password)
        });

        // show graph
        initWithLiveData();
    });
    authDialog.showModal();

}

// Non-blocking alert()
export function showUserMessage(title, message) {
    const userMessage = document.getElementById('userMessage');
    userMessage.showModal();
    userMessage.querySelector('.dialog-header').textContent = title;
    userMessage.querySelector('.dialog-content').textContent = message;
}