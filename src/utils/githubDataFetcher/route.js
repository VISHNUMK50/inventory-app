export async function fetchCategoryStats(config) {
  const { owner, repo, token, path } = config;
  const dbPath = `${path}/jsons`;
  
  // Fetch directory contents
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${dbPath}?ref=master`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  if (!response.ok) throw new Error('Failed to fetch directory');
  const files = await response.json();

  // Initialize category stats
  const categoryStats = {};
  let totalQuantity = 0;

  // Process files
  for (const file of files) {
    if (file.name.endsWith('.json')) {
      const fileContent = await fetch(file.download_url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const item = await fileContent.json();
      
      const category = item.category || 'Uncategorized';
      const quantity = parseInt(item.avl_quantity) || 0;

      if (!categoryStats[category]) {
        categoryStats[category] = {
          totalQuantity: 0,
          uniqueItems: 0,
          items: []
        };
      }
      
      categoryStats[category].totalQuantity += quantity;
      if (!categoryStats[category].items.includes(item.partName)) {
        categoryStats[category].items.push(item.partName);
        categoryStats[category].uniqueItems += 1;
      }
      totalQuantity += quantity;
    }
  }

  // Convert to array format
  return Object.entries(categoryStats).map(([name, stats]) => ({
    name,
    count: stats.totalQuantity,
    items: stats.uniqueItems,
    color: getCategoryColor(name),
    totalCount: totalQuantity
  }));
}

function getCategoryColor(category) {
  const colors = {
    'Battery': 'blue',
    'IC': 'green',
    'Resistor': 'purple',
    'Capacitor': 'yellow',
    'Connector': 'red',
    'Module': 'indigo',
    'Tool': 'orange',
    'PCB': 'teal',
    'LED': 'pink',
    'Sensor': 'cyan',
    'Microcontroller': 'violet',
    'Switch': 'emerald',
    'Diode': 'amber',
    'Other': 'gray',
    'Uncategorized': 'gray'
  };
  return colors[category] || 'gray';
}