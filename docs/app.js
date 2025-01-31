// external libraries
import neo4j from './lib/neo4j-driver@5.27.0.mjs';
import cytoscape from './lib/cytoscape@3.31.0.mjs';
import cytoscape_cola from './lib/cytoscape-cola@2.5.1.mjs';
import cytoscape_popper from './lib/cytoscape-popper@2.0.0.mjs'
import { CookieStorage, UrlHash } from './lib/browser-utils.js';
import cytoscape_layout from './config/layout-cola.js';
import cytoscape_style from './config/cytoscape-style.js';
import { demo_data } from './demo/demodata.js';

// app configuration
cytoscape.use(cytoscape_cola);
cytoscape.use(cytoscape_popper);

// global vars
let cy;

// run app
(async () => {
    if ((new CookieStorage()).get("mpilhlt_neo4j_credentials")) {
        await initWithLiveData();
    } else {
        await initWithDemoData();
    }

    // login to the Neo4J database
    document.getElementById('login-button').addEventListener('click', authenticate);

    // Add a listener for center node changes
    window.addEventListener('hashchange', () => {
        const nodeId = UrlHash.get('nodeId');
        if (nodeId) {
            showRadial(nodeId)
        }
    });

    // Configure what happens when the user interacts with the graph
    setupNodeBehavior()
})();

async function initWithLiveData() {
    const credentials = (new CookieStorage()).get("mpilhlt_neo4j_credentials");
    let data;
    try {
        data = await fetchGraph(credentials.endpoint, credentials.database, credentials.username, atob(credentials.password));
    } catch (error) {
        showUserMessage('Error', 'Failed to fetch data from Neo4J: ' + error.message);
    }
    init(data);
}

function initWithDemoData() {
    demo_data.forEach(node => { 
        node.data.description = "Description for " + node.data.label;
        node.data.url = node.data.url || "https://example.com/" + node.data.id;
    });
    init(demo_data);
}

// Non-blocking alert()
function showUserMessage(title, message) {
    const userMessage = document.getElementById('userMessage');
    userMessage.showModal();
    userMessage.querySelector('.dialog-header').textContent = title;
    userMessage.querySelector('.dialog-content').textContent = message;
}

// Show the graph
function init(data) {
    initGraph(data);
    addVirtualNodes();
    const nodeId = UrlHash.get("nodeId")
    if (nodeId && cy.$id(nodeId).length > 0) {
        showRadial(nodeId)
    } else if (UrlHash.has("all")) {
        cy.layout(cytoscape_layout).run();
    } else {
        showRadial('Tasks');
    }
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
    
    // content
    let content = '';
    content += `<p>${node.data("description")}</p>`;
    const url = node.data("url");
    if (url) {
        const hostname = new URL(url).hostname;
        content += `<p><a href="${url}" target="_blank">More information on ${hostname}</a></p>`;
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

function setupNodeBehavior() {

    // navigation by long-tapping on a node
    const navigate_handler = (event) => {
        hideNodeInfo()
        // Update URL hash and potentially update the graph
        UrlHash.set('nodeId', event.target.id());
    };

    // show node info on tap
    const tap_handler = (event) => {  
        const node = event.target;
        if (node.data('type') === 'Virtual') {
            navigate_handler(event);
        } else{
            showNodeInfo(node);
        }
    };

    // attach handlers
    cy.on('tap', 'node', tap_handler);
    cy.on('taphold', 'node', navigate_handler);
    cy.on('dbltap', 'node', navigate_handler);
}


function addVirtualNodes() {
    const types = new Set(cy.nodes(`[type]`).map(node => node.data('type')))
    for (let type of types) {
        const id = `${type}s`;
        if (cy.$id(id).length == 0) {
            // Add a virtual node with the label of the type 
            const virtualNode = cy.add({
                data: {
                    id,
                    label: type + 's',
                    type: 'Virtual',
                    description: 'This is a virtual node representing all ' + type + 's.'
                }
            });
            // Link all nodes of that type to the virtual node
            cy.nodes(`[type="${type}"]`).forEach(node => {
                cy.add({
                    data: {
                        id: `edge-${id}-${node.id()}`,
                        source: id,
                        target: node.id()
                    }
                });
            });
        }
    }
}

// Function to show a radial network for a selected node
function showRadial(nodeId) {

    const node = cy.$(`#${nodeId}`);

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




// Neo4J authentication
function authenticate() {
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
            data.background_url = node.properties.image_url;
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

