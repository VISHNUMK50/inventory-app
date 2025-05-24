// src/config/githubConfig.js
const githubConfig = {
    token: process.env.NEXT_PUBLIC_DATABASE_PAT|| '',
    // repo: process.env.GITHUB_REPO ||"inventory-app",
    repo: process.env.GITHUB_REPO ||"inv-db",
    owner: process.env.GITHUB_OWNER ||"VISHNUMK50",
    branch: "master",
    // path: "database"
    path: "db",
    datasheets: "db/datasheets"
  };
  
  export default githubConfig;