// src/config/githubConfig.js
const githubConfig = {
    token: process.env.NEXT_PUBLIC_DATABASE_PAT|| '',
    repo: process.env.GITHUB_REPO ||"inventory-app",
    owner: process.env.GITHUB_OWNER ||"VISHNUMK50",
    branch: "master",
    path: "database"
  };
  
  export default githubConfig;