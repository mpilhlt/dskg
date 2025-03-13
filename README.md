# mpilhlt Knowledge Graph Viewer

This repo contains the code for the Knowledge Graph Viewer that we experiment with to display the digital services at at the Max Planck Institute for Legal History and Legal Theory.

A prototype of the web application is [here](https://mpilhlt.github.io/dskg).

## Connect to a Neo4J database:

1. `cp ./neo4j.json.dist ./neo4j.json`
2. Adapt the values in `neo4j.json`.

## Update npm dependencies:

1. run `npm install`. This will generate ESM-Modules in the lib folder.
2. update the import paths in `app.js`.
