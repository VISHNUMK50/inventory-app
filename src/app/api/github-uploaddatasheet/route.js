import { NextResponse } from 'next/server';
import { saveFileToGithub } from '@/utils/githubApi';

export async function POST(req) {
    try {
        const { githubConfig, filePath, content, message } = await req.json();
        if (!githubConfig || !filePath || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        await saveFileToGithub({
            token: githubConfig.token,
            repo: githubConfig.repo,
            owner: githubConfig.owner,
            branch: githubConfig.branch,
            filePath,
            content,
            message: message || `Upload file ${filePath}`,
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}