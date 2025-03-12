import neo4j from './lib/neo4j-driver@5.27.0.mjs';

// fetches graph data from Neo4J
export async function fetchGraph(connection_data) {
  const { endpoint, database, username, password } = connection_data
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
    const elementId = node.elementId;
    const data = { id, label, type, elementId };
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

export async function testWriteAccess(connection_data) {
  const { endpoint, database, username, password } = connection_data
  const driver = neo4j.driver(endpoint, neo4j.auth.basic(username, password));
  const session = driver.session({ database });
  try {
    await session.run(`MERGE (n:TestNode {name: 'Test1'})-[r:TEST_RELATION]->(m:TestNode {name: 'Test2'})`);
    await session.run(`MATCH (n:TestNode {name: 'Test1'}) SET n.name = 'Test3'`);
  } catch (error) {
    if (error.message.includes('not allowed')) {
      return false;
    }
    throw error;
  } finally {
    session.close();
  }
  return true;
}

export async function updateProperties(connection_data, elementId, propertyMap) {
  const { endpoint, database, username, password } = connection_data
  const driver = neo4j.driver(endpoint, neo4j.auth.basic(username, password));
  const session = driver.session({ database });
  try {
    for (const [key, value] of Object.entries(propertyMap)) {
      await session.run(`MATCH (n) WHERE id(n) = $elementId SET n.${key} = $value`, { elementId, value });
    }
  } catch (error) {
    throw error;
  } finally {
    session.close();
  }
  return true;
}

