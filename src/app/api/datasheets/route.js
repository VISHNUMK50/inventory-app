import { NextResponse } from 'next/server';
import githubConfig from '@/config/githubConfig';

export async function GET() {
    try {
        const url = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.datasheets}`;
        console.log('Fetching datasheets from:', url);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('GitHub API error:', {
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
        const jsonsResponse = await fetch(jsonsUrl, {
            headers: {
                'Authorization': `Bearer ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
        });
        const jsonFiles = await jsonsResponse.json();
        const jsonFilesMap = new Map(jsonFiles.map(file => {
            const name = file.name.replace('.json', '');
            return [name, file];
        }));

        // Inside the GET function, update the datasheets mapping:
const datasheets = await Promise.all(files
    .filter(file => file.name.toLowerCase().endsWith('.pdf'))
    .map(async (file) => {
        const parts = file.name.split('-');
        const id = parts[0];
        const partName = parts[1] || '';
        const manufacturerPart = parts[2] || '';
        const originalFileName = parts.slice(3).join('-');

        // Create the identifier to match with JSON files
        const jsonIdentifier = `${id}-${partName}-${manufacturerPart}`;
        const matchingJsonFile = jsonFilesMap.get(jsonIdentifier);

        // Fetch the JSON content if available
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
                console.error(`Error fetching JSON content for ${jsonIdentifier}:`, error);
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
            jsonContent, // Include the JSON content in the response
            htmlUrl: `https://github.com/${githubConfig.owner}/${githubConfig.repo}/blob/${githubConfig.branch}/${githubConfig.datasheets}/${file.name}`,
            updatedAt: new Date().toISOString(),
            size: file.size
        };
    }));

        return NextResponse.json(datasheets);

    } catch (error) {
        console.error('Unhandled error in datasheets route:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch datasheets',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}