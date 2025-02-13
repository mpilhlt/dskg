export default [
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
        selector: 'node[image_url]',
        style: {
            'background-image': el => `url(${el.data('image_url')})`,
            'background-image-crossorigin': 'null',
            'background-fit': 'cover', // Adjust to fit the node
            'color': '#ffffff', // Text color: white
            'text-outline-width': 1,
        }
    },
    {
        selector: 'node[type="Type"]',
        style: {
            'label': 'data(label)',
            'shape': 'round-rectangle',
            'background-color': '#f0f0f0',
            'width': '60px',
            'height': '40px',
        }
    },
    {
        selector: 'node[type="Task"]',
        style: {
            'shape': 'round-rectangle',
            'background-color': '#6495ED',
        }
    },
    {
        selector: 'node[type="Tool"]',
        style: {
            'shape': 'ellipsis',
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