import { NextResponse } from 'next/server';
import githubConfigImport from '@/config/githubConfig';

// Helper to get user config from request (e.g., via headers or cookies)
async function getUserGithubConfig(request) {
  // Extract username and uid from headers
  const username = request.headers.get('x-username');
  const uid = request.headers.get('x-uid');
  console.log('Headers:', {
    'x-username': username,
    'x-uid': uid
  });
  let config = { ...githubConfigImport };
  if (username && uid) {
    config.path = `${username}-${uid}/db`;
    config.datasheets = `${username}-${uid}/db/datasheets`;
  }
  console.log('getUserGithubConfig path:', config.path);
  return config;
}

export async function GET(request) {
  try {
    const githubConfig = await getUserGithubConfig(request);
    const { owner, repo, token, path: userPath } = githubConfig;
    const path = userPath ? `${userPath}/jsons` : 'db/jsons';
    console.log('API GET: userPath:', userPath);
    console.log('API GET: path:', path);

    // Fetch inventory files
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=master`;
    console.log('Fetching inventory files from:', url);
    const response = await fetch(
      url,
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
        console.log('Fetching file:', file.download_url);
        const fileContent = await fetch(file.download_url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const item = await fileContent.json();
        inventory.push(item);
      }
    }
    // Calculate totals
    const totalCount = inventory.reduce((sum, item) => sum + (parseInt(item.avl_quantity) || 0), 0);
    const onHand = inventory.reduce((sum, item) => sum + (parseInt(item.avl_quantity) || 0), 0);
    const onLoan = inventory.reduce((sum, item) => sum + (parseInt(item.on_loan) || 0), 0);

    const stats = {
      productLines: inventory.length,
      noStock: inventory.filter(item => parseInt(item.avl_quantity) === 0).length,
      lowStock: inventory.filter(item =>
        parseInt(item.avl_quantity) > 0 &&
        parseInt(item.avl_quantity) <= parseInt(item.reorderPoint)
      ).length,
      totalCount,
      onHand,
      onLoan
    };

    const lowStockItems = inventory
      .filter(item => 
        parseInt(item.avl_quantity) > 0 && 
        parseInt(item.avl_quantity) <= parseInt(item.reorderPoint)
      )
      .map(item => ({
        id: item.id || Math.random().toString(36).substr(2, 9),
        name: item.partName,
        manufacturer: item.manufacturer || "",
        category: item.category,
        current: parseInt(item.avl_quantity),
        minimum: parseInt(item.reorderPoint)
      }));

    return NextResponse.json({ stats, lowStockItems });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory data' },
      { status: 500 }
    );
  }
}