import { NextResponse } from 'next/server';
import githubConfigImport from '@/config/githubConfig';

// Helper to get user config from request (e.g., via headers or cookies)
async function getUserGithubConfig(request) {
  const username = request.headers.get('x-username');
  const uid = request.headers.get('x-uid');
  let config = { ...githubConfigImport };
  if (username && uid) {
    config.path = `${username}-${uid}/db`;
    config.datasheets = `${username}-${uid}/db/datasheets`;
  }
  return config;
}

async function getLastModifiedFiles(githubConfig) {
  try {
    const { owner, repo, token } = githubConfig;

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) throw new Error('Failed to fetch commits');

    const commits = await response.json();
    const activities = [];

    for (const commit of commits) {
      // Get file changes for each commit
      const detailResponse = await fetch(commit.url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!detailResponse.ok) continue;

      const detail = await detailResponse.json();

      for (const file of detail.files) {
        if (
          file.filename.startsWith(`${githubConfig.path}/jsons/`) &&
          file.status === 'added'
        ) {
          try {
            const content = await fetch(file.raw_url, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }).then(res => res.json());
            if (content.id === '1000') continue;

            activities.push({
              id: commit.sha.substring(0, 7),
              action: `Added ${content.avl_quantity} units of ${content.partName}`,
              date: new Date(commit.commit.author.date).toLocaleDateString(),
              user: commit.commit.author.name
            });
          } catch (error) {
            console.error('Error processing file:', error);
          }
        }
      }
    }

    return activities.slice(0, 4); // Return only the 4 most recent activities
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function GET(request) {
  try {
    const githubConfig = await getUserGithubConfig(request);
    const activities = await getLastModifiedFiles(githubConfig);
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}