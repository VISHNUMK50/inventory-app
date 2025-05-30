import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { githubConfig } = await req.json();
        console.log('[API] Received githubConfig:', githubConfig);

        if (!githubConfig) {
            console.error('[API] No githubConfig provided');
            return NextResponse.json({ error: "Missing githubConfig" }, { status: 400 });
        }

        const url = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.datasheets}`;
        console.log('[API] Fetching datasheets from:', url);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[API] GitHub API error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            return NextResponse.json({
                error: `GitHub API error: ${response.status} ${response.statusText}`,
                details: errorData
            }, { status: response.status });
        }

        const files = await response.json();

        // Fetch JSON files from db/jsons directory
        const jsonsUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/db/jsons`;
        console.log('[API] Fetching JSONs from:', jsonsUrl);
        const jsonsResponse = await fetch(jsonsUrl, {
            headers: {
                'Authorization': `Bearer ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
        });
        const jsonFiles = await jsonsResponse.json();

        const safeJsonFiles = Array.isArray(jsonFiles) ? jsonFiles : [];
        if (!Array.isArray(jsonFiles)) {
    console.error('[API] jsonFiles is not an array:', jsonFiles);
}
        const jsonFilesMap = new Map(safeJsonFiles.map(file => {
            const name = file.name.replace('.json', '');
            return [name, file];
        }));
        const datasheets = await Promise.all(files
            .filter(file => file.name.toLowerCase().endsWith('.pdf'))
            .map(async (file) => {
                const parts = file.name.split('-');
                const id = parts[0];
                const partName = parts[1] || '';
                const manufacturerPart = parts[2] || '';
                const originalFileName = parts.slice(3).join('-');
                const jsonIdentifier = `${id}-${partName}-${manufacturerPart}`;

                // Find the first JSON file whose name starts with the id
                const matchingJsonFile = Array.from(jsonFilesMap.values()).find(jsonFile =>
                    jsonFile.name.startsWith(id)
                );
console.log('[API] JSON files fetched:', safeJsonFiles.map(f => f.name));
                console.log('[API] Matching JSON file for', id, ':', matchingJsonFile ? matchingJsonFile.name : 'None');
                // Fetch the content of the matching JSON file
                let jsonContent = null;
                if (matchingJsonFile) {
                    try {
                        const jsonResponse = await fetch(matchingJsonFile.download_url, {
                            headers: {
                                'Authorization': `Bearer ${githubConfig.token}`,
                                'Accept': 'application/vnd.github.v3.raw'
                            }
                        });
                        jsonContent = await jsonResponse.json();
                    } catch (error) {
                        console.error(`[API] Error fetching JSON content for ${id}:`, error);
                    }
                }

                return {
                    id,
                    name: jsonIdentifier,
                    partNumber: manufacturerPart,
                    originalFileName: originalFileName || file.name,
                    description: partName,
                    downloadUrl: file.download_url,
                    jsonFile: matchingJsonFile ? matchingJsonFile.download_url : null,
                    jsonContent,
                    htmlUrl: `https://github.com/${githubConfig.owner}/${githubConfig.repo}/blob/${githubConfig.branch}/${githubConfig.datasheets}/${file.name}`,
                    updatedAt: new Date().toISOString(),
                    size: file.size
                };
            }));

        return NextResponse.json(datasheets);

    } catch (error) {
        console.error('[API] Unhandled error in datasheets route:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch datasheets',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}