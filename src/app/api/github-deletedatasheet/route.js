import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { githubConfig, filePath, message } = await req.json();
        if (!githubConfig || !filePath) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        // Get file SHA
        const apiUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${filePath}`;
        const fileRes = await fetch(apiUrl, {
            headers: { Authorization: `token ${githubConfig.token}` }
        });
        if (!fileRes.ok) {
            return NextResponse.json({ error: 'File not found on GitHub' }, { status: 404 });
        }
        const fileData = await fileRes.json();
        const sha = fileData.sha;

        // Delete file
        const deleteRes = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                Authorization: `token ${githubConfig.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message || `Delete file ${filePath}`,
                sha,
                branch: githubConfig.branch
            })
        });
        if (!deleteRes.ok) {
            return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}