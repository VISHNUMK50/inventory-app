/**
 * Fetch inventory items from GitHub repo.
 * @param {Object} config - GitHub config { token, repo, owner, path }
 * @returns {Promise<Array>} - Array of inventory items
 */
export async function fetchInventoryFromGitHub(config) {
  if (!config.token || !config.repo || !config.owner) {
    throw new Error("GitHub configuration is incomplete");
  }

  const { token, repo, owner, path } = config;
  const jsonDirPath = path ? `${path}/jsons` : 'db/jsons';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${jsonDirPath}`;

  // Helper to fetch and parse JSON files
  const processFiles = async (files) => {
    const itemPromises = files.map(async (file) => {
      if (file.type === "file" && file.name.endsWith(".json")) {
        const fileResponse = await fetch(file.download_url, {
          headers: { "Accept": "application/vnd.github.v3.raw" }
        });
        if (!fileResponse.ok) return null;
        const itemData = await fileResponse.json();
        const fileNameMatch = file.name.match(/^(\d+)-.*\.json$/);
        if (fileNameMatch && !itemData.id) itemData.id = fileNameMatch[1];
        return itemData;
      }
      return null;
    });
    return (await Promise.all(itemPromises)).filter(Boolean);
  };

  // Fetch directory listing
  const response = await fetch(apiUrl, {
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json"
    }
  });

  if (response.status === 404) {
    throw new Error("Inventory directory not found");
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`);
  }

  const files = await response.json();
  return processFiles(files);
}