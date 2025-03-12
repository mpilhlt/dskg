// external libraries
import cytoscape from './lib/cytoscape@3.31.0.mjs';
import cytoscape_cola from './lib/cytoscape-cola@2.5.1.mjs';
//import cytoscape_popper from './lib/cytoscape-popper@2.0.0.mjs'
import { CookieStorage, UrlHash } from './lib/browser-utils.js';
import cytoscape_layout from './config/layout-cola.js';
import cytoscape_style from './config/cytoscape-style.js';

// app modules
import {setupLogin, showUserMessage} from './login.js';
import {fetchGraph, testWriteAccess, updateProperties} from './neo4j.js';
import {setupLiveEditing} from './edit.js';

// shorthand for document selectors
const $ = (selector, node) => (node||document).querySelector(selector);
const $$ = (selector, node) => (node||document).querySelectorAll(selector);

// app configuration
cytoscape.use(cytoscape_cola);
//cytoscape.use(cytoscape_popper); // not used yet

// global vars
let cy;

// run app
(async () => {

    // get data from neo4j or demo json
    let graph_data;
    let connection_data;
    let file_data;
    try {
        connection_data = (new CookieStorage()).get("mpilhlt_neo4j_credentials");
        if (connection_data) {
          // decode base64 encoded password
          connection_data['password'] = atob(connection_data['password']);
        } else {
          // get credentials from json file
            file_data = await fetch('../neo4j.json');
            connection_data = await file_data.json();
        }
        // get the graph data from the given connection
        graph_data = await fetchGraph(connection_data);
        // if connection data is not from a file, check if we can edit the data and enable editing if possible
        file_data || testWriteAccess(connection_data).then((result) => {
          if (result) {
            console.log('Write access granted');
            $('#node-info').classList.add('edit-enabled');
            setupLiveEditing(handleSave);
          }
        }); 
    } catch (error) {
        if (error instanceof SyntaxError) {
            // a SyntaxError is thrown when the JSON file is not found and a 404 error is returned, 
            // which cannot be parsed as JSON. We ignore this error in this case.
        } else {
            // credentials seem to be wrong
            console.error('Could not retrieve data from Neo4j: ' + error.message);
            (new CookieStorage()).remove("mpilhlt_neo4j_credentials");
        }
        // in any case, we load the demo data instead
        graph_data = await getDemoData();
    }

    // show login button
    setupLogin(true);

    // initialize the graph
    initGraph(graph_data);

    // Configure what happens when the user interacts with the graph
    setupNodeBehavior();

    // Add a listener for center node changes
    window.addEventListener('hashchange', updateView);
        
    // add button actions
    $('#task-button').addEventListener('click', () =>  UrlHash.set('view', 'Task'));
    $('#people-button').addEventListener('click', () =>  UrlHash.set('view', 'Person'));
    $('#tool-button').addEventListener('click', () =>  UrlHash.set('view', 'Tool'));

    // show grid or radial view
    updateView();
})();

const UNDO_STACK = []; 

function handleSave(prop, value, previousValue) {
  //UNDO_STACK.push({property: prop, value: previousValue})
  // todo implement undo 

  alert(`NOT IMPLEMENTED: Saving ${prop}: ${value}`)
  // TODO: Save the value to your data source
}


function updateView() {   
    const view = UrlHash.get('view') || UrlHash.get('nodeId') || 'Task';
    switch (view) {     
        case 'Task':
        case 'Person':
        case 'Tool':
            showNodeGrid(`[type="${view}"]`);
            break;
        default:
            showRadial(view)
    }
    UrlHash.remove('nodeId');
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
        showNodeInfo(node);
    };

    // attach handlers
    cy.on('tap', 'node', tap_handler);
    cy.on('taphold', 'node', navigate_handler);
    cy.on('dbltap', 'node', navigate_handler);
}


// fetch demo data from local json file
async function getDemoData() {
    console.log('Using demo data');
    const demo_data = (await import('./demo/demodata.js')).default;
    demo_data.forEach(node => {
        node.data.description = "Description for " + node.data.label;
        node.data.url = node.data.url || "https://example.com/" + node.data.id;
    });
    return demo_data;
}

// Initialize Cytoscape graph
function initGraph(data) {
    cy = cytoscape({
        container: document.getElementById('cy'),
        elements: data,
        style: cytoscape_style
    });
}

function showNodeInfo(node) {
    const container = $('#node-info');
    
    // title
    $('#node-info-title').innerHTML = node.data("label") || '';
    
    // description
    $('#node-info-description').innerHTML = node.data("description") || '';
    
    // image
    const node_info_img = $('#node-info-image')
    if (node.data("image_url")) {
        node_info_img.src = node.data("image_url")
        node_info_img.alt = `Image for ${node.data("label")}`
        node_info_img.display = 'block';
    } else {
        node_info_img.src = ''
        node_info_img.alt = ''
        node_info_img.display = 'none';
    }

    // url link
    const url = node.data("url");
    const node_info_url = $('#node-info-url');
    let url_text
    if (url) {
        try {
            const hostname = new URL(url).hostname;
            url_text = `<a href="${url}" target="_blank">More information on ${hostname}</a>`;
        }
        catch (e) {   
            url_text = url;
        }
        node_info_url.innerHTML = url_text  
     } else {
        node_info_url.innerHTML = '';
    }
    
    // show container
    container.style.display = "block";
}

function hideNodeInfo() {
    const node_info_area = document.getElementById('node-info');
    node_info_area.style.display = "none";
}

// Function to show a radial network for a selected node
function showRadial(nodeId) {

    console.log('Showing radial network for node:', nodeId);

    const node = cy.$(`#${nodeId}`);
    node.unlock();

    if (!node || node.empty()) {
        console.error(`Node with ID ${nodeId} does not exist.`);
        return;
    }

    const connectedEdges = node.connectedEdges();
    const connectedNodes = connectedEdges.targets().add(connectedEdges.sources());
    const parentEdges = node.incomers('edge');
    const parentNodes = parentEdges.sources();

    // Show only the selected node, its direct children, and its parent
    cy.elements().hide();
    node.show();
    connectedNodes.show();
    connectedEdges.show();
    parentNodes.show();
    parentEdges.show();

    // Apply a concentric layout with the node at the center
    cy.layout(cytoscape_layout).run();
}

// Function to show the nodes selected by the selector in a grid
function showNodeGrid(selector) {
    console.log('Showing node grid for selector:', selector);
    const nodes = cy.nodes(selector);
    
    // sort the nodes by label
    nodes.sort((a, b) => a.data('label').localeCompare(b.data('label')))
        .forEach((node, index) => node.data('index', index)); 

    // show only those noded
    cy.elements().hide();
    nodes.show();
    
    // Apply a grid layout to the nodes by manually placing them
    let nodeCount = nodes.length;
    let rows = Math.ceil(Math.sqrt(nodeCount));
    let cols = Math.ceil(nodeCount / rows);
    const spacing = 10; // Spacing between nodes
    const nodeWidth = 60; // Width of each node
    const nodeHeight = 60; // Height of each node
    
    nodes.forEach((node) => {
        let index = node.data('index'); // Access the index assigned earlier
        let col = index % cols;
        let row = Math.floor(index / cols);
        
        // Calculate positions based on node dimensions and spacing
        let xPos = col * (nodeWidth + spacing);
        let yPos = row * (nodeHeight + spacing);
      
        // Set the position of each node
        node.position({ x: xPos, y: yPos });
      });
      
      // Optionally fit the layout to viewport
      cy.fit(cy.nodes(), 50); // Add padding of 50 (can adjust as needed)4
      cy.layout({ name: 'preset',  randomize: false }).run();
      nodes.lock()
}
