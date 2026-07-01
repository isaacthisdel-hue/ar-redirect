// Servision AR Redirect Service
// Deployed on Vercel at ar.servision.ca
// Converts: ar.servision.ca/bella-italia/downtown/margherita-pizza
// To:       https://isaacthisdel.github.io/ar-bella-italia/downtown/margherita-pizza

const GITHUB_USERNAME = 'isaacthisdel'; // your GitHub username

module.exports = (req, res) => {
  const path = req.url || '/';
  const parts = path.replace(/^\//, '').split('/').filter(Boolean);

  if (parts.length === 0) {
    return res.redirect(302, 'https://servision.ca');
  }

  const restaurantSlug = parts[0];
  const folderPath = parts.slice(1).join('/');
  const repoName = 'ar-' + restaurantSlug;
  const githubBase = 'https://' + GITHUB_USERNAME + '.github.io/' + repoName;
  const target = folderPath ? githubBase + '/' + folderPath : githubBase;

  res.redirect(302, target);
};
