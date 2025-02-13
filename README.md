# mpilhlt Digital Services Knowledge Graph

This repo contains code relating to the Digital Services Knowledge Graph project at the Max Planck Institut for Legal History and Legal Theory.

A prototype of the planned web application is [here](https://mpilhlt.github.io/dskg).

## Connect to a Neo4J database:

1. `cp ./neo4j.json.dist ./neo4j.json`
2. Adapt the values in `neo4j.json`.

## Update npm dependencies:

1. run `npm install`. This will generate ESM-Modules in the lib folder.
2. update the import paths in `app.js`.

