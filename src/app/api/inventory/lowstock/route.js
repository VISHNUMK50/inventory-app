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

    let inventory = [];
    for (const file of files) {
      if (file.name.endsWith('.json')) {
        const fileContent = await fetch(file.download_url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const item = await fileContent.json();
        inventory.push(item);
      }
    }

    const stats = {
      productLines: inventory.length,
      noStock: inventory.filter(item => parseInt(item.avl_quantity) === 0).length,
      lowStock: inventory.filter(item => 
        parseInt(item.avl_quantity) > 0 && 
        parseInt(item.avl_quantity) <= parseInt(item.reorderPoint)
      ).length
    };

    const lowStockItems = inventory
      .filter(item => 
        parseInt(item.avl_quantity) > 0 && 
        parseInt(item.avl_quantity) <= parseInt(item.reorderPoint)
      )
      .map(item => ({
        id: item.id || Math.random().toString(36).substr(2, 9),
        name: item.partName,
        category: item.category,
        current: parseInt(item.avl_quantity),
        minimum: parseInt(item.reorderPoint)
      }))
      .slice(0, 5); // Show only top 5 low stock items

    return NextResponse.json({ stats, lowStockItems });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory data' },
      { status: 500 }
    );
  }
}