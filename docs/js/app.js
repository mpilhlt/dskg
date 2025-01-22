// imported via <script> in index.html: cytoscape_style, cytoscape_layout, CookieStorage, UrlHash
// todo: use proper module imports

// global vars
let cy;

// non-blocking alert()
function showUserMessage(title, message) {
    const userMessage = document.getElementById('userMessage');
    userMessage.showModal();
    userMessage.querySelector('.dialog-header').textContent = title;
    userMessage.querySelector('.dialog-content').textContent = message;
}

// Initialize Cytoscape graph
function initGraph(data) {
    // configure graph
    cy = cytoscape({
        container: document.getElementById('cy'),
        elements: data,
        style: cytoscape_stye
    });

    // Node click event sets hash value
    cy.on('tap', 'node', (event) => {
        const nodeId = event.target.id();
        UrlHash.set('nodeId', nodeId)
    });

    // Add a listener for center node changes
    window.addEventListener('hashchange', () => {
        const nodeId = UrlHash.get('nodeId');
        if (nodeId) {
            showRadial(nodeId)
        }
    });    
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

// Add a radial network for nodes of the given type
function showNodesOfType(type) {
    cy.elements().hide();
    const typeNodes = cy.nodes(`[type="${type}"]`);
    typeNodes.show();
    const id = `virtual-${type}-node`;

    if (cy.$id(id).length == 0) {
        // Add a virtual node with the label of the type 
        const virtualNode = cy.add({
            data: {
                id,
                label: type + 's',
                type: 'Virtual'
            }
        });
        // Link all nodes of that type to the virtual node
        typeNodes.forEach(node => {
            cy.add({
                data: {
                    id: `virtual-edge-${id}-${node.id()}`,
                    source: id, 
                    target: node.id()
                }
            });
        });
    }
    showRadial(id);
}


// Add a radial network for the "Tasks" virtual node
function showTasks() {
    // Show only the "Task" nodes
    cy.elements().hide(); 
    const taskNodes = cy.nodes('[type="Task"]');
    taskNodes.show(); 

    // Add a virtual node with the label "Tasks"
    const virtualNode = cy.add({
        data: {
            id: 'tasks-node',  // Unique ID for the virtual node
            label: 'Tasks',    // Label for the virtual node
            type: 'Virtual'    // Custom type for the virtual node
        }
    });

    // Link all task nodes to the virtual node
    taskNodes.forEach(taskNode => {
        cy.add({
            data: {
                id: `edge-${taskNode.id()}-${virtualNode.id()}`,  // Unique edge ID
                source: virtualNode.id(),     // Source is the virtual node
                target: taskNode.id()         // Target is each task node
            }
        });
    });
    showRadial('tasks-node'); // Show radial network for the virtual node
}

// Neo4J authentication
function authenticate() {
    const authDialog = document.getElementById('authDialog');
    const cancelButton = document.getElementById('cancelButton');
    const authForm = document.getElementById('authForm');

    // Use demo data if the user cancels the dialog
    cancelButton.addEventListener('click', () => {
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
        const cookieStorage = new CookieStorage({
            path: '/',
            secure: true,
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 // 7 days
        });
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
        return {data};
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

async function initWithLiveData() {
    const credentials = (new CookieStorage()).get("mpilhlt_neo4j_credentials");
    let data;
    try {
        data = await fetchGraph(credentials.endpoint, credentials.database, credentials.username, atob(credentials.password));
    } catch (error) {
        showUserMessage('Error', 'Failed to fetch data from Neo4J: ' + error.message);
    }
    initGraph(data);
    showTasks();
}

function initWithDemoData() {
    initGraph(demo);
    showTasks();
}