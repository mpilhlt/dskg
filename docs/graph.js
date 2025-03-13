import cytoscape from './lib/cytoscape@3.31.0.mjs';
import cytoscape_cola from './lib/cytoscape-cola@2.5.1.mjs';
import cytoscape_layout from './config/layout-cola.js';
import cytoscape_style from './config/cytoscape-style.js';
//import cytoscape_popper from './lib/cytoscape-popper@2.0.0.mjs'

// app configuration
cytoscape.use(cytoscape_cola);
//cytoscape.use(cytoscape_popper); // not used yet

let cy;

export function getGraph() {
  return cy;
}

// Initialize Cytoscape graph
export function initGraph(data) {
  cy = cytoscape({
    container: document.getElementById('cy'),
    elements: data,
    style: cytoscape_style
  });
}

// Function to show a radial network for a selected node
export function showRadial(nodeId) {

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
export function showNodeGrid(selector) {
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
  cy.layout({ name: 'preset', randomize: false }).run();
  nodes.lock()
}