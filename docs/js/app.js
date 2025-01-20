
// global graph object
let cy;

// Initialize Cytoscape graph
function initGraph(data) {
    // configure graph
    cy = cytoscape({
        container: document.getElementById('cy'),
        elements: data,
        style: [
            {
                selector: 'node[width]', // Only apply this style to nodes with a `width` data field
                style: {
                    'label': 'data(label)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'background-color': '#6495ED',
                    'color': '#ffffff',
                    'width': 'data(width)',
                    'height': 'data(width)',
                    'font-size': function (ele) {
                        const nodeWidth = ele.data('width');
                        return nodeWidth && nodeWidth > 0
                            ? Math.max(6, Math.min(12, nodeWidth * 0.3))
                            : 10;
                    },
                    'text-wrap': 'wrap',
                    'text-max-width': '80px',
                    'min-zoomed-font-size': 6
                }
            },
            {
                selector: 'node', // Default style for nodes without a `width` field
                style: {
                    'label': 'data(label)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'background-color': '#6495ED',
                    'color': '#000000', // Default text color
                    'width': 60, // Default size
                    'height': 60,
                    'font-size': 10, // Default font size
                    'text-wrap': 'wrap',
                    'text-max-width': '60px',
                    'min-zoomed-font-size': 6
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
    const childNodes = cy.nodes(`[type="${type}"]`);
    childNodes.show();
    // Add a virtual node with the label of the type 
    const virtualNode = cy.add({
        data: {
            id: `virtual-${type}-node`,
            label: type + 's',
            type: 'Virtual'
        },
        style: {
            'background-color': '#f0f0f0',
            'width': '60px',
            'height': '60px',
            'label': 'Tasks'
        }
    });

    // Link all task nodes to the virtual node
    childNodes.forEach(taskNode => {
        cy.add({
            data: {
                id: `edge-${taskNode.id()}`,  // Unique edge ID
                source: virtualNode.id(),     // Source is the virtual node
                target: taskNode.id()         // Target is each task node
            }
        });
    });
    showRadial('tasks-node'); // Show radial network for the virtual node
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
            'background-color': '#f0f0f0', // Give virtual node a neutral color
            'width': '60px',  // Define size
            'height': '60px',
            'label': 'Tasks'
        }
    });

    // Link all task nodes to the virtual node
    taskNodes.forEach(taskNode => {
        cy.add({
            data: {
                id: `edge-${taskNode.id()}`,  // Unique edge ID
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

    try {
        // get nodes
        const result = await session.run(`MATCH (n) RETURN n`);
        const nodes = result.records.map((record) => {
            const node = record.get('n');
            return {
                data: {
                    id: "node-" + node.identity.low,
                    label: node.properties.name,
                    type: node.labels[0]
                }
            };
        });
        // get edges
        const result2 = await session.run(`MATCH (n)-[r]->(m) RETURN n, r, m`);
        const edges = result2.records.map((record) => {
            const edge = record.get('r');
            return {
                data: {
                    id: "edge-" + edge.identity.low,
                    source: "node-" + edge.start.low,
                    target: "node-" + edge.end.low,
                    type: edge.type
                }
            };
        });
        const data = nodes.concat(edges);
        //console.dir(data)
        return data;
    } catch (error) {
        console.error(error)
        throw error; // Rethrow the error
    } finally {
        session.close();
    }
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