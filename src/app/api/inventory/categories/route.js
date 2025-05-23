import { NextResponse } from 'next/server';
import githubConfig from '@/config/githubConfig';

export async function GET() {
  try {
    const { owner, repo, token } = githubConfig;
    const path = 'db/jsons';
    
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=master`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) throw new Error('Failed to fetch directory');
    const files = await response.json();

    // Initialize category stats object
    const categoryStats = {};
    let totalQuantity = 0;

    // Process each JSON file
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
            totalQuantity: 0,    // Sum of all avl_quantity in this category
            uniqueItems: 0,      // Count of unique parts in this category
            items: []            // Store part names to check uniqueness
          };
        }
        
        // Add quantity to category total
        categoryStats[category].totalQuantity += quantity;
        // Only count unique items by partName
        if (!categoryStats[category].items.includes(item.partName)) {
          categoryStats[category].items.push(item.partName);
          categoryStats[category].uniqueItems += 1;
        }
        totalQuantity += quantity;
      }
    }

    // Convert to array format for frontend
    const categories = Object.entries(categoryStats).map(([name, stats]) => ({
      name,
      count: stats.totalQuantity,          // Total quantity of items
      items: stats.uniqueItems,            // Number of unique parts
      color: getCategoryColor(name),
      totalCount: totalQuantity
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// Helper function to get category colors
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