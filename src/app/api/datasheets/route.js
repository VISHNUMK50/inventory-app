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
    
    if (!Array.isArray(files)) {
      console.error('Invalid response format:', files);
      return NextResponse.json({ 
        error: 'Invalid response from GitHub API' 
      }, { status: 500 });
    }

    const datasheets = files
      .filter(file => file.name.toLowerCase().endsWith('.pdf'))
      .map(file => {
        const nameparts = file.name.split('-');
        const id = nameparts[0];
        const partNumber = nameparts[1];
        const description = nameparts[2]?.replace('.pdf', '') || '';
        
        return {
          id,
          name: file.name.replace('.pdf', ''),
          partNumber,
          description,
          downloadUrl: file.download_url,
          htmlUrl: `https://github.com/${githubConfig.owner}/${githubConfig.repo}/blob/${githubConfig.branch}/${githubConfig.datasheets}/${file.name}`,
          updatedAt: new Date().toISOString(),
          size: file.size
        };
      });

    console.log(`Successfully fetched ${datasheets.length} datasheets`);
    return NextResponse.json(datasheets);

  } catch (error) {
    console.error('Unhandled error in datasheets route:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch datasheets',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}