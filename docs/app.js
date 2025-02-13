// external libraries
import neo4j from './lib/neo4j-driver@5.27.0.mjs';
import cytoscape from './lib/cytoscape@3.31.0.mjs';
import cytoscape_cola from './lib/cytoscape-cola@2.5.1.mjs';
//import cytoscape_popper from './lib/cytoscape-popper@2.0.0.mjs'
import { CookieStorage, UrlHash } from './lib/browser-utils.js';
import cytoscape_layout from './config/layout-cola.js';
import cytoscape_style from './config/cytoscape-style.js';

import {setupLogin} from './login.js';


// app configuration
cytoscape.use(cytoscape_cola);
//cytoscape.use(cytoscape_popper); // not used yet

// global vars
let cy;

// run app
(async () => {

    // get data from neo4j or demo json
    let graph_data;
    try {
        let credentials;
        if ((new CookieStorage()).get("mpilhlt_neo4j_credentials")) {
            credentials = (new CookieStorage()).get("mpilhlt_neo4j_credentials");
        } else {
            const res = await fetch('../neo4j.json');
            credentials = await res.json();
        } 
        setupLogin(false);
        const {endpoint, database, username, password} = credentials
        graph_data = await fetchGraph(endpoint, database, username, password);
    } catch (error) {
        // a SyntaxError is thrown when the JSON file is not found and a 404 error is returned, 
        // which cannot be parsed as JSON. We ignore this error in this case and output it otherwise.
        if (!(error instanceof SyntaxError)) {
            console.error('Could not retrieve data from Neo4j: ' + error.message);
        }
        // we assume that we're in a non-safe environment and don't allow to log in or to store credentials
        setupLogin(true);
        (new CookieStorage()).remove("mpilhlt_neo4j_credentials");
        graph_data = await getDemoData();
    }

    // initialize the graph
    initGraph(graph_data);

    // Configure what happens when the user interacts with the graph
    setupNodeBehavior();

    // Add a listener for center node changes
    window.addEventListener('hashchange', updateView);
        
    // add button actions
    document.getElementById('task-button').addEventListener('click', () =>  UrlHash.set('view', 'Task'));
    document.getElementById('people-button').addEventListener('click', () =>  UrlHash.set('view', 'Person'));
    document.getElementById('tool-button').addEventListener('click', () =>  UrlHash.set('view', 'Tool'));

    // show grid or radial view
    updateView();
})();

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
    const node_info_area = document.getElementById('node-info');
    const title_elem = node_info_area.getElementsByClassName('node-info-title')[0];
    const content_elem = node_info_area.getElementsByClassName('node-info-content')[0];

    // title
    title_elem.innerHTML = node.data("label");

    // description
    let content = '';
    content += `<p>${node.data("description")}</p>`;
    const url = node.data("url");

    // url link
    if (url) {
        const hostname = new URL(url).hostname;
        content += `<p><a href="${url}" target="_blank">More information on ${hostname}</a></p>`;
    }

    // image
    if (node.data("image_url")) {
        content += `<img src="${node.data("image_url")}" alt="Image for ${node.data("label")}" class="node-info-image">`;
    }

    // Instructions for navigation
    content += `<p>Long-tap or double-click on a node to navigate...</p>`;
    content_elem.innerHTML = content;
    node_info_area.style.display = "block";
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

// fetches graph data from Neo4J
async function fetchGraph(endpoint, database, username, password) {
    const driver = neo4j.driver(endpoint, neo4j.auth.basic(username, password));
    const session = driver.session({ database });
    let node_result, edge_result;
    try {
        node_result = await session.run(`MATCH (n) RETURN n`);
        edge_result = await session.run(`MATCH (n)-[r]->(m) RETURN r`);
    } catch (error) {
        console.error(error)
        throw error; // Rethrow the error
    } finally {
        session.close();
    }
    const nodes = node_result.records.map((record) => {
        const node = record.get('n');
        const type = node.labels[0];
        const id = "node-" + node.identity.low
        const label = node.properties.name;
        const data = { id, label, type };
        if (node.properties.image_url) {
            data.image_url = node.properties.image_url;
        }
        if (node.properties.URL) {
            data.url = node.properties.URL;
        }
        data.description = node.properties.description || '';
        return { data };
    });
    const edges = edge_result.records.map((record) => {
        const edge = record.get('r');
        return {
            data: {
                id: `edge-${edge.start.low}-${edge.end.low}`,
                source: "node-" + edge.start.low,
                target: "node-" + edge.end.low,
                type: edge.type
            }
        };
    });
    const data = nodes.concat(edges);
    //console.dir(data)
    return data;
}

