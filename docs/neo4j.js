import neo4j from './lib/neo4j-driver@5.27.0.mjs';

 const CONNECTION_DATA = {};

 export async function initConnection(connection_data) {
    Object.assign(CONNECTION_DATA, connection_data);
 }

function getSession() {
  const { endpoint, database, username, password } = CONNECTION_DATA
  const driver = neo4j.driver(endpoint, neo4j.auth.basic(username, password));
  return driver.session({ database });
}

// fetches graph data from Neo4J
export async function fetchGraphData() {
  const session = getSession();
  let node_result, edge_result;
  try {
    // get nodes and edges which have not been deleted
    node_result = await session.run(`MATCH (n) where n.deleted IS NULL RETURN n `);
    edge_result = await session.run(`MATCH (n)-[r]->(m) where n.deleted IS NULL and m.deleted IS NULL and r.deleted IS NULL RETURN r`);
  } catch (error) {
    console.error(error)
    throw error; // Rethrow the error
  } finally {
    session.close();
  }
  const nodes = node_result.records.map((record) => {
    const node = record.get('n');
    const data = neo2cyto(node);
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

function neo2cyto(node) {
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
  return data;
}

export async function testWriteAccess() {
  const session = getSession();
  try {
    await session.run(`MERGE (n:TestNode {name: 'Test1'})-[r:TEST_RELATION]->(m:TestNode {name: 'Test2'})`);
    await session.run(`MATCH (n:TestNode {name: 'Test1'}) SET n.name = 'Test3'`);
    await session.run(`MATCH (n:TestNode {name: 'Test3'})-[r:TEST_RELATION]->(m:TestNode {name: 'Test2'}) delete n,r,m`)
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

export async function updateNode(elementId, propertyMap) {
  const session = getSession();
  try {
    for (let [key, value] of Object.entries(propertyMap)) {
      switch (key) {  
        case 'label':
          key = 'name';
      }
      await session.run(`MATCH (n) WHERE elementId(n) = $elementId SET n.${key} = $value`, { elementId, value });
    }
  } catch (error) {
    throw error;
  } finally {
    session.close();
  }
  return true;
}

export async function getMetadata() {
  const session = getSession();
  try {
      const result = await session.run(`MATCH (m:Metadata) return m.key as key, m.value as value`);
      const metadata = result.records.reduce((acc, record) => {
        let value = record.get('value');
        try {
          value = JSON.parse(value);
        } catch (error) {
          // ignore
        }
        acc[record.get('key')] = value;
        return acc;
      }, {});
      return metadata;
  } catch (error) {
    throw error;
  } finally {
    session.close();
  }
}

export async function setMetadata(key, value) {
  const session = getSession();
  try {
    await session.run(`MERGE (m:Metadata {key: $key}) SET m.value = $value`, { key, value: JSON.stringify(value) });
  } catch (error) {
    throw error;
  } finally {
    session.close();
  }
  return true;
}

export async function addRelation(elementId, relation, label, properties = {}) {
  const session = getSession();
  let res;
  try {
    res = await session.run(`
      MATCH (n) WHERE elementId(n) = $elementId
      CREATE (n)-[:${relation}]->(m:${label})
      SET m = $properties
      RETURN m`, { elementId, properties }); 
  } catch (error) {
    throw error;
  } finally {
    session.close();
  }
  return  neo2cyto(res.records[0].get('m'));
}


export async function removeNode(elementId) {
  const session = getSession();
  try {
    res = await session.run(`
      MATCH (n) WHERE elementId(n) = $elementId DETACH DELETE n`); 
  } catch (error) {
    throw error;
  } finally {
    session.close();
  }
  return true;
}