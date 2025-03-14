// custom libraries
import { CookieStorage, UrlHash } from './lib/browser-utils.js';
import { showUserMessage } from './lib/dialogs.js'

// app modules
import { setAuthStatus, getStoredConnectionData, logout } from './login.js';
import { initConnection, fetchGraphData, testWriteAccess, updateNode, getMetadata, addRelation } from './neo4j.js';
import { setupLiveEditing } from './edit.js';
import { initGraph, getGraph, showRadial, showNodeGrid } from './graph.js';

// shorthand for document selectors
const $ = (selector, node) => (node || document).querySelector(selector);
const $$ = (selector, node) => (node || document).querySelectorAll(selector);

// global vars
let metadata;
let selectedNode;

// run app
(async () => {
  // get data from neo4j or demo json
  let graph_data;
  let connection_data;
  let file_data;
  let timeout = 2000; // timeout of 2 seconds for file retrieval and neo4j connection
  try {
    connection_data = getStoredConnectionData();
    if (!connection_data) {
      console.log("Looking for local credentials...")
      const controller = new AbortController(); 
      const signal = controller.signal;
      setTimeout(() => controller.abort(), timeout); 
      // get credentials from json file
      file_data = await fetch('../neo4j.json', {signal});
      connection_data = await file_data.json();
      console.log("Retrieved credentials from neoj.json")
    }

    // initialize the connection and process metadata
    await initConnection(connection_data, timeout);
    metadata = await getMetadata();
    processMetadata(metadata);

    // get the graph data from the given connection
    graph_data = await fetchGraphData();
    // if connection data is not from a file, check if we can edit the data and enable editing if possible
    if (!file_data) {
      try {
        const hasWriteAccess = await testWriteAccess();
        if (hasWriteAccess) {
          $('#node-info').classList.add('edit-enabled');
          setupLiveEditing(handleSave);
          setAuthStatus(true, connection_data.username);
        } else {
          setAuthStatus(false)
        }
      } catch (error) {
        console.error(error.message)
        //logout();
      }
    }
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof AbortSignal ) {
      // Ignore if file cannot be found. This is indicated by a SyntaxError which is thrown when the JSON file is not found 
      // and a 404 error is returned, which cannot be parsed as JSON, the timeout is reached, which throws an
      // AbortError
      console.log("No local neo4j.json file.")
    } else {
      // Timeout, Authentication, or any other error
      console.warn(`${error.name}: `+ error.message);
    }
    // in any case, we load the demo data instead
    UrlHash.remove('view');
    [graph_data, metadata] = await getDemoData();
    setAuthStatus(false);
  }

  // initialize the graph
  initGraph(graph_data);

  // Configure what happens when the user interacts with the graph
  setupNodeBehavior();

  // Add a listener for center node changes
  window.addEventListener('hashchange', updateView);

  // add button actions
  if (metadata["ui.gridview.types"]) {
    metadata["ui.gridview.types"].forEach(type => {
      const button = document.createElement('button');
      button.textContent = type + "s";
      button.addEventListener('click', () => UrlHash.set('view', type));
      $('#login-button').before(button);
    });
  }

  // activate undo button
  $('#undo-button').addEventListener('click', undo);

  // show grid or radial view
  updateView();
})();


function processMetadata(metadata) {
  const cookieStorage = new CookieStorage();
  if (metadata.title) {
    $('#title').innerHTML = document.title = metadata.title;
    // show welcome message but only once per session
    if (cookieStorage.get('kg-viewer.welcome_message') !== metadata.title) {
      cookieStorage.set('kg-viewer.welcome_message', metadata.title);
      showUserMessage(metadata.title, metadata.description);
    }
  }
}

// fetch demo data from local json file
async function getDemoData() {
  console.log('Using demo data');
  const demo_data = (await import('./demo/demodata.js')).default;
  demo_data.forEach(node => {
    node.data.description = "Description for " + node.data.label;
    node.data.url = node.data.url || "https://example.com/" + node.data.id;
  });
  const metadata = {  
    title: "Knowledge Graph Viewer",
    description: "This is a demo of the Knowledge Graph Viewer. Click on a node to see more information.",
    "ui.gridview.types": ["Task", "Person", "Tool"]
  };
  return [demo_data, metadata];
}

function updateView() {
  const view = UrlHash.get('view') || 'Task';
  switch (view) {
    case 'Task':
    case 'Person':
    case 'Tool':
      showNodeGrid(`[type="${view}"]`);
      break;
    default:
      const node = getGraph().$(`#${view}`);
      if (node) {
        showRadial(view)
        showNodeInfo(node);
      } else {
        hideNodeInfo()
        UrlHash.remove('view')
      }
  }
}

function setupNodeBehavior() {
  // navigation by long-tapping on a node
  const navigate_handler = (event) => {
    hideNodeInfo()
    // Update URL hash and potentially update the graph
    UrlHash.set('view', event.target.id());
  };

  // show node info on tap
  const tap_handler = (event) => {
    const node = event.target;
    selectedNode = node;
    showNodeInfo(node);
  };

  // attach handlers
  const cy = getGraph();
  cy.on('tap', 'node', tap_handler);
  cy.on('taphold', 'node', navigate_handler);
  cy.on('dbltap', 'node', navigate_handler);
}

function showNodeInfo(node) {
  const container = $('#node-info');
  const type = node.data("type");

  // title
  $('#node-info-title').innerHTML = node.data("label") || '';

  // description
  $('#node-info-description').innerHTML = node.data("description") || '';

  // image
  const node_info_img = $('#node-info-image')
  const node_info_image_url = $('#node-info-image-url');
  if (node.data("image_url")) {
    node_info_img.src = node.data("image_url")
    node_info_img.alt = `Image for ${node.data("label")}`
    node_info_img.display = 'block';
    node_info_image_url.value = node.data("image_url");
  } else {
    node_info_img.src = ''
    node_info_img.alt = ''
    node_info_img.display = 'none';
    node_info_image_url.value = '';
  }

  // url link
  const url = node.data("url");
  const node_info_url = $('#node-info-url');
  const node_info_url_formatted = $('#node-info-url-formatted');
  let url_text
  if (url) {
    try {
      const hostname = new URL(url).hostname;
      url_text = `<a href="${url}" target="_blank">More information on ${hostname}</a>`;
    }
    catch (e) {
      url_text = url;
    }
    node_info_url.value = url;
    node_info_url_formatted.innerHTML = url_text
  } else {
    node_info_url.value = '';
    node_info_url_formatted.innerHTML = ''
  }
  
  // edit buttons
  const buttonContainer = $('#node-info-buttons');
  buttonContainer.innerHTML = '';

  // add child node if node is at the center
  if (node.data('id') == UrlHash.get('view')) {
    Object.entries(metadata)
      .filter(([key, value]) => key.startsWith('ui.edit.allow'))
      .forEach(([key, value]) => {
        if (value) {
          let [label1, rel, label2] = key.split('.').slice(-3);
          if (label1 === type) {
            const button = document.createElement('button');
            button.textContent = `New ${label2}`;
            button.classList.add('edit-only');
            button.addEventListener('click', async () => await createChildNode(node, rel, label2));
            buttonContainer.appendChild(button);
          }
        }
      })
    }

  // delete node
  if (metadata["ui.edit.allow.delete"] && metadata["ui.edit.allow.delete"].includes(type)) {
    const deleteButton = document.createElement('button');
    deleteButton.textContent = `Delete ${type}`;
    deleteButton.classList.add('edit-only');
    deleteButton.classList.add('danger');
    deleteButton.addEventListener('click', async () => {
      if (confirm(`Do you really want to delete "${node.data('label')}"?`)) {
        await deleteNode(node);
        hideNodeInfo();
      }
    });
    buttonContainer.appendChild(deleteButton);
  }
  // show container
  container.style.display = "flex";
}

async function createChildNode(parent, rel, label) {
  const properties = {name: `New ${label}`};
  const data = await addRelation(parent.data('elementId'), rel, label, properties);
  //getGraph().add(data);
  UrlHash.set('view', data.id);
  document.location.reload();
}

async function deleteNode(node, allowUndo = true) { 
  try {
    await updateNode(node.data('elementId'), {deleted: true});
    if (allowUndo) {
      undo(async () => {
        await updateNode(node.data('elementId'), {deleted: false});
      });
    }
    node.remove();
    hideNodeInfo();
  } catch (error) {
    showUserMessage('Error', 'Could not delete node: ' + error.message);
  }
}

function hideNodeInfo() {
  const node_info_area = document.getElementById('node-info');
  node_info_area.style.display = "none";
}

async function handleSave(prop, value, previousValue) {
  let node = selectedNode || getGraph().$(`#${UrlHash.get('view')}`);
  if (!node) {   
    console.error('No node selected');
    return;
  }
  if (previousValue){
    undo(async () => {
      await _updateNode(node, prop, previousValue);
      $(`[data-prop="${prop}"]`).textContent = previousValue;
    })
  }
  await _updateNode(node, prop, value);
}

async function _updateNode(node, prop, value) {
  const elementId = node.data('elementId');
  try {
    await updateNode(elementId, { [prop]: value });
  } catch (error) {
    console.error('Could not update node:', error);
    showUserMessage('Error', 'Could not update node: ' + error.message);
  }
  node.data(prop, value);
  console.log('Updated node:', node.data('label'));
}


const UNDO_FUNC_STACK = [];
/**
 * when passing a function, it will be added to the undo stack
 * when calling without arguments, it will undo the last action, returning a promise if the action was async
 */
function undo(undoFunc) {
  if (typeof undoFunc == 'function') {
    UNDO_FUNC_STACK.push(undoFunc);
    $('#undo-button').style.display = 'block';
  } else if (UNDO_FUNC_STACK.length > 0) {
    const maybePromise = UNDO_FUNC_STACK.pop()();
    if (UNDO_FUNC_STACK.length === 0) {
      $('#undo-button').style.display = 'none';
    }
    return maybePromise;
  }
}