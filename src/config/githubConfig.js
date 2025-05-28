const githubConfig = (username, uid) => ({
  token: process.env.NEXT_PUBLIC_DATABASE_PAT || '',
  repo: process.env.GITHUB_REPO || "inv-db",
  owner: process.env.GITHUB_OWNER || "VISHNUMK50",
  branch: "master",
  path: `${username}-${uid}/db`, // Dynamically set the path
  datasheets: `${username}-${uid}/db/datasheets`, // Dynamically set the datasheets path
});

export default githubConfig;