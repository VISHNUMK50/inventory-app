import { NextResponse } from 'next/server';
import { getGithubConfig } from '@/config/githubConfig';

export async function GET(request) {
  try {
    const config = await getGithubConfig();
    if (!config) {
      return NextResponse.json(
        { error: 'GitHub configuration not available' },
        { status: 401 }
      );
    }

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

    if (!response.ok) {
      throw new Error(`Failed to fetch directory: ${response.status}`);
    }

    const files = await response.json();
    let inventory = [];

    // Process all JSON files
    for (const file of files) {
      if (file.name.endsWith('.json')) {
        const fileContent = await fetch(file.download_url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (fileContent.ok) {
          const item = await fileContent.json();
          if (item && typeof item === 'object') {
            inventory.push({
              id: item.id || file.name.replace('.json', ''),
              name: item.partName || 'Unknown Part',
              category: item.category || 'Uncategorized',
              current: parseInt(item.avl_quantity) || 0,
              minimum: parseInt(item.reorderPoint) || 0
            });
          }
        }
      }
    }

    // Calculate statistics
    const stats = {
      productLines: inventory.length,
      noStock: inventory.filter(item => item.current === 0).length,
      lowStock: inventory.filter(item => item.current > 0 && item.current <= item.minimum).length
    };

    // Get items that need attention (low stock or out of stock)
    const lowStockItems = inventory
      .filter(item => item.current <= item.minimum)
      .sort((a, b) => (a.current / a.minimum) - (b.current / b.minimum))
      .slice(0, 5);

    return NextResponse.json({
      stats,
      lowStockItems
    });

  } catch (error) {
    console.error('Error in lowstock API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory data' },
      { status: 500 }
    );
  }
}