
// global vars
let cy;

// Initialize Cytoscape graph
function initGraph(data) {
    // configure graph
    cy = cytoscape({
        container: document.getElementById('cy'),
        elements: data,
        style: [
            {
                // default node style
                selector: 'node',
                style: {
                    
                    'width': 60, 
                    'height': 60,                    
                    'label': 'data(label)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    
                    'color': '#000000', // Default text color: black
                    'font-size': 8, 
                    'text-wrap': 'wrap',
                    'text-max-width': '60px',
                    'min-zoomed-font-size': 6                    
                }
            },
            {
                // Style for nodes which have a background image
                selector: 'node[background_url]', 
                style: {
                    'background-image': el => `url(${el.data('background_url')})`,
                    'background-image-crossorigin': 'null',
                    'background-fit': 'cover', // Adjust to fit the node
                    'color': '#ffffff', // Text color: white
                }
            },
            {
                selector: 'node[type="Task"]',
                style: {
                    'shape': 'ellipse', 
                    'background-color': '#6495ED',
                }
            },  
            {
                selector: 'node[type="Tool"]',
                style: {
                    'shape': 'round-rectangle',
                    'background-color': '#b43a3a',
                    'height': 40
                }
            }, 
            {
                selector: 'node[type="Resource"]',
                style: {
                    'shape': 'tag',
                    'background-color': '#b81bb2',
                    'height': 40
                }
            },
            {
                selector: 'node[type="Organization"]',
                style: {
                    'shape': 'round-octagon',
                    'background-color': '#999494',
                    'height': 40
                }
            },               
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#cccccc',
                    'target-arrow-color': '#cccccc',
                    'target-arrow-shape': 'triangle'
                }
            }
        ]
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
    cy.layout({
        name: 'cose',
        // 'draft', 'default' or 'proof" 
        // - 'draft' fast cooling rate 
        // - 'default' moderate cooling rate 
        // - "proof" slow cooling rate
        quality: 'default',
        // Whether to include labels in node dimensions. Useful for avoiding label overlap
        nodeDimensionsIncludeLabels: false,
        // number of ticks per frame; higher is faster but more jerky
        refresh: 30,
        // Whether to fit the network view after when done
        fit: true,
        // Padding on fit
        padding: 10,
        // Whether to enable incremental mode
        randomize: true,
        // Node repulsion (non overlapping) multiplier
        nodeRepulsion: 4500,
        // Ideal (intra-graph) edge length
        idealEdgeLength: 50,
        // Divisor to compute edge forces
        edgeElasticity: 0.45,
        // Nesting factor (multiplier) to compute ideal edge length for inter-graph edges
        nestingFactor: 0.1,
        // Gravity force (constant)
        gravity: 0.25,
        // Maximum number of iterations to perform
        numIter: 2500,
        // Whether to tile disconnected nodes
        tile: true,
        // Type of layout animation. The option set is {'during', 'end', false}
        animate: 'end',
        // Duration for animate:end
        animationDuration: 500,
        // Amount of vertical space to put between degree zero nodes during tiling (can also be a function)
        tilingPaddingVertical: 10,
        // Amount of horizontal space to put between degree zero nodes during tiling (can also be a function)
        tilingPaddingHorizontal: 10,
        // Gravity range (constant) for compounds
        gravityRangeCompound: 1.5,
        // Gravity force (constant) for compounds
        gravityCompound: 1.0,
        // Gravity range (constant)
        gravityRange: 3.8,
        // Initial cooling factor for incremental layout
        initialEnergyOnIncremental: 0.5
    }).run();
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
            },
            style: {
                'label': 'data(label)',
                'background-color': '#f0f0f0',
                'width': '60px',
                'height': '60px',
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
    cy.elements().hide(); // Hide everything
    const taskNodes = cy.nodes('[type="Task"]'); // Get task nodes
    taskNodes.show(); // Show only task nodes
    // Add a virtual node with the label "Tasks"
    const virtualNode = cy.add({
        data: {
            id: 'tasks-node',  // Unique ID for the virtual node
            label: 'Tasks',    // Label for the virtual node
            type: 'Virtual'    // Custom type for the virtual node
        },
        style: {
            'label': 'data(label)', // Show the label
            'background-color': '#f0f0f0', // Give virtual node a neutral color
            'width': '60px',  // Define size
            'height': '60px',
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

// better than alert()
function showUserMessage(title, message) {
    const userMessage = document.getElementById('userMessage');
    userMessage.showModal();
    userMessage.querySelector('.dialog-header').textContent = title;
    userMessage.querySelector('.dialog-content').textContent = message;
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