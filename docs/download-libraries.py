import os
import requests

output_dir = "docs/lib"

urls = {
    "cytoscape": "https://unpkg.com/cytoscape/dist/cytoscape.esm.min.js",
    "d3": "https://cdn.jsdelivr.net/npm/d3@5/dist/d3.min.js",
    "neo4j-driver": "https://unpkg.com/neo4j-driver/lib/browser/neo4j-web.js"
}

for name, url in urls.items():
    response = requests.get(url)
    if response.status_code == 200:
        with open(os.path.join(output_dir, f"{name}.js"), "wb") as file:
            file.write(response.content)
        print(f"Downloaded {name} from {url}")
    else:
        print(f"Failed to download {name} from {url}: {response.status_code}")

# then do `npm install cytoscape-cose-bilkent`

