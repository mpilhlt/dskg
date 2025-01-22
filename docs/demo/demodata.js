// Demo data to show when we have not Neo4J connection
export const demo_data = [
    // Tasks
    { data: { id: 'task1', label: 'Task 1', type: 'Task' } },
    { data: { id: 'task2', label: 'Task 2', type: 'Task' } },
    { data: { id: 'task3', label: 'Task 3', type: 'Task' } },
    { data: { id: 'task4', label: 'Task 4', type: 'Task' } },
    // Tools
    { data: { id: 'tool1', label: 'Tool 1', type: 'Tool', url: 'https://www.zotero.org' } },
    { data: { id: 'tool2', label: 'Tool 2', type: 'Tool' } },
    { data: { id: 'tool3', label: 'Tool 3', type: 'Tool' } },
    { data: { id: 'tool4', label: 'Tool 4', type: 'Tool' } },
    // Resources and People
    { data: { id: 'resource1', label: 'Web-Resource 1', url: 'https://developer.mozilla.org/en-US', type: 'Resource' } },
    { data: { id: 'resource2', label: 'Web-Resource 2', url: 'https://guides.nyu.edu/digital-humanities/tools-and-software', type: 'Resource' } },
    { data: { id: 'person1', label: 'Person 1', type: 'Person', background_url: 'demo/kermit.png' } },
    { data: { id: 'person2', label: 'Person 2', type: 'Person', background_url: 'demo/misspiggy.png' } },
    { data: { id: 'org1', label: 'Organization 1', type: 'Organization' } },
    { data: { id: 'org2', label: 'Organization 2', type: 'Organization' } },
    // Edges
    { data: { id: 'e1', source: 'task1', target: 'tool1' } },
    { data: { id: 'e2', source: 'task1', target: 'tool2' } },
    { data: { id: 'e3', source: 'task2', target: 'tool3' } },
    { data: { id: 'e4', source: 'task3', target: 'tool4' } },
    { data: { id: 'e5', source: 'tool1', target: 'resource1' } },
    { data: { id: 'e6', source: 'tool2', target: 'person1' } },
    { data: { id: 'e6b', source: 'tool1', target: 'person1' } },
    { data: { id: 'e7', source: 'tool3', target: 'resource2' } },
    { data: { id: 'e8', source: 'tool4', target: 'person2' } },
    { data: { id: 'e8b', source: 'tool3', target: 'person2' } },
    { data: { id: 'e9', source: 'person1', target: 'org1' } },
    { data: { id: 'e10', source: 'person2', target: 'org2' } }
]
  
  