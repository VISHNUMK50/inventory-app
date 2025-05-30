import { NextResponse } from 'next/server';
import githubConfigImport from '@/config/githubConfig';

// Helper to get user config from request (e.g., via headers or cookies)
async function getUserGithubConfig(request) {
  // Extract username and uid from headers
  const username = request.headers.get('x-username');
  const uid = request.headers.get('x-uid');
  let config = { ...githubConfigImport };
  if (username && uid) {
    config.path = `${username}-${uid}/db`;
    config.datasheets = `${username}-${uid}/db/datasheets`;
  }
  return config;
}

const categoryColorMap = {};
function getRandomColor() {
  const colorMap = {
    blue: "#2563eb",
    green: "#22c55e",
    red: "#dc2626",
    yellow: "#eab308",
    purple: "#9333ea",
    indigo: "#4f46e5",
    orange: "#ea580c",
    teal: "#14b8a6",
    pink: "#db2777",
    cyan: "#06b6d4",
    violet: "#8b5cf6",
    emerald: "#10b981",
    amber: "#f59e42",
    lime: "#84cc16",
    rose: "#f43f5e",
    fuchsia: "#d946ef",
    sky: "#0ea5e9"
  };
  const keys = Object.keys(colorMap);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return randomKey; // Return the color name, not the hex
}

function getCategoryColor(category) {
  if (!categoryColorMap[category]) {
    categoryColorMap[category] = getRandomColor();
  }
  return categoryColorMap[category];
}

export async function GET(request) {
  try {
    const githubConfig = await getUserGithubConfig(request);
    const { owner, repo, token, path: userPath } = githubConfig;
    const path = userPath ? `${userPath}/jsons` : 'db/jsons';

    // Fetch inventory files
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

    // Fetch all categories from dropdownOptions.json (use user path if present)
    const dropdownPath = userPath
      ? `${userPath}/dropdownOptions.json`
      : 'db/dropdownOptions.json';
    const dropdownRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${dropdownPath}?ref=master`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    let allCategories = [];
    if (dropdownRes.ok) {
      const dropdownData = await dropdownRes.json();
      const content = JSON.parse(Buffer.from(dropdownData.content, 'base64').toString('utf-8'));
      allCategories = Array.isArray(content.categories) ? content.categories : [];
    }

    // Build inventory stats
    const categoryStats = {};
    let totalQuantity = 0;
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

    // Merge dropdown categories with inventory stats
    const mergedCategories = (allCategories.length > 0 ? allCategories : Object.keys(categoryStats)).map((name) => {
      const stats = categoryStats[name] || { totalQuantity: 0, uniqueItems: 0, items: [] };
      return {
        name,
        count: stats.totalQuantity,
        items: stats.uniqueItems,
        color: getCategoryColor(name),
        totalCount: totalQuantity
      };
    });

    return NextResponse.json(mergedCategories);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}