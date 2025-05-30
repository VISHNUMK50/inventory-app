// Helper: Safe base64 encode/decode
export const safeBase64Encode = (str) => {
    try {
        const utf8Bytes = new TextEncoder().encode(str);
        const binaryStr = String.fromCharCode.apply(null, utf8Bytes);
        return btoa(binaryStr);
    } catch {
        return btoa(unescape(encodeURIComponent(str)));
    }
};
export const safeBase64Decode = (str) => {
    try {
        const binaryStr = atob(str);
        const utf8Bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            utf8Bytes[i] = binaryStr.charCodeAt(i);
        }
        return new TextDecoder().decode(utf8Bytes);
    } catch  {
        return decodeURIComponent(escape(atob(str)));
    }
};
export const saveLastUsedIdToGithub = async ({ token, repo, owner, branch, path, newId, setLastUsedId }) => {
    if (!token || !repo || !owner) {
        localStorage.setItem('lastUsedId', newId.toString());
        if (setLastUsedId) setLastUsedId(newId);
        return;
    }
    const idTrackerPath = `${path}/lastUsedId.json`;
    const content = btoa(JSON.stringify({ lastUsedId: newId }));
    await saveFileToGithub({
        token, repo, owner, branch,
        filePath: idTrackerPath,
        content,
        message: `Update last used ID to ${newId}`
    });
    localStorage.setItem('lastUsedId', newId.toString());
    if (setLastUsedId) setLastUsedId(newId);
};

export const saveDropdownOptionsToGithub = async ({ token, repo, owner, branch, path, options, setDropdownOptions }) => {
    if (!token || !repo || !owner) {
        localStorage.setItem('dropdownOptions', JSON.stringify(options));
        if (setDropdownOptions) setDropdownOptions(options);
        return;
    }
    const optionsFilePath = `${path}/dropdownOptions.json`;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${optionsFilePath}`;
    let sha = '';
    try {
        const checkResponse = await fetch(apiUrl, {
            headers: { "Authorization": `token ${token}` }
        });
        if (checkResponse.ok) {
            const fileData = await checkResponse.json();
            sha = fileData.sha;
        }
    } catch {}
    const optionsString = JSON.stringify(options, null, 2);
    const content = btoa(optionsString);
    const requestBody = {
        message: "Update dropdown options",
        content,
        branch
    };
    if (sha) requestBody.sha = sha;
    const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });
    if (!response.ok) throw new Error(`GitHub API error: ${await response.text()}`);
    localStorage.setItem('dropdownOptions', JSON.stringify(options));
    if (setDropdownOptions) setDropdownOptions(options);
};
// Save a file to GitHub
export const saveFileToGithub = async ({ token, repo, owner, branch, filePath, content, message }) => {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    let sha = '';
    try {
        const checkResponse = await fetch(apiUrl, {
            headers: { "Authorization": `token ${token}` }
        });
        if (checkResponse.ok) {
            const fileData = await checkResponse.json();
            sha = fileData.sha;
        }
    } catch {}
    const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message,
            content,
            branch,
            sha
        })
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
};

// Batch commit multiple files
export const batchCommitToGithub = async ({ token, repo, owner, branch, fileUpdates, commitMessage }) => {
    // Get current tree SHA
    const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        headers: { "Authorization": `token ${token}` }
    });
    if (!refResponse.ok) throw new Error(await refResponse.text());
    const refData = await refResponse.json();
    const commitSha = refData.object.sha;
    const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${commitSha}`, {
        headers: { "Authorization": `token ${token}` }
    });
    const commitData = await commitResponse.json();
    const treeSha = commitData.tree.sha;

    // Create blobs
    const newBlobs = await Promise.all(fileUpdates.map(async (file) => {
        const blobResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
            method: "POST",
            headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: file.content,
                encoding: "base64"
            })
        });
        const blobData = await blobResponse.json();
        return {
            path: file.path,
            mode: "100644",
            type: "blob",
            sha: blobData.sha
        };
    }));

    // Create new tree
    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        method: "POST",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            base_tree: treeSha,
            tree: newBlobs
        })
    });
    const treeData = await treeResponse.json();

    // Create commit
    const newCommitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: "POST",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: commitMessage,
            tree: treeData.sha,
            parents: [commitSha]
        })
    });
    const newCommitData = await newCommitResponse.json();

    // Update ref
    const updateRefResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        method: "PATCH",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            sha: newCommitData.sha,
            force: true
        })
    });
    if (!updateRefResponse.ok) throw new Error(await updateRefResponse.text());
    return newCommitData;
};