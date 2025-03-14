import { CookieStorage } from "./lib/browser-utils.js"; // replace with https://github.com/js-cookie/js-cookie ?

const cookieStorage = new CookieStorage();
const COOKIE_NAME = 'kg-viewer.connection_data';
let user_is_authenticated = false;

// setup login button
const login_button = document.getElementById('login-button');
login_button.addEventListener('click', () => {
  if (user_is_authenticated) {
    logout();
  } else {
    authenticate();
  }
});

export function getAuthStatus() {
  return user_is_authenticated;
}

export function getStoredConnectionData() {
  const connection_data = cookieStorage.get(COOKIE_NAME);
  if (connection_data) {
    connection_data['password'] = atob(connection_data['password'])
  }
  return connection_data;
}

export function setAuthStatus(status = false, username) {
  user_is_authenticated = status
  login_button.style.display = 'block'; 
  if (user_is_authenticated) {
    login_button.textContent = `Logout ${username}`;
  } else {
    login_button.textContent = 'Login';
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
    const { endpoint, database, username, password } = form.elements;
    cookieStorage.set(COOKIE_NAME, {
      endpoint: endpoint.value,
      database: database.value,
      username: username.value,
      password: btoa(password.value)
    });
    document.location.reload();
  });
  dialog.showModal();
}

export function logout() {
  setAuthStatus(false);
  cookieStorage.remove(COOKIE_NAME);
  document.location.reload(); 
}
