// Configuration de l'environnement
// Pour définir le token GitHub, modifiez directement la valeur ci-dessous :
// githubToken: 'votre_token_github_ici'
// 
// OU créez un fichier .env dans frontEnd/ avec :
// NG_APP_GITHUB_TOKEN=votre_token_ici
// Puis redémarrez le serveur de développement

// Note: Les variables d'environnement doivent être préfixées par NG_APP_ pour être accessibles
// Elles sont injectées au build time via angular.json
declare const process: any;

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  // Remplacez 'votre_token_github_ici' par votre token GitHub réel
  // OU laissez vide et configurez via .env ou config.json
  githubToken: (typeof process !== 'undefined' && process.env && process.env['NG_APP_GITHUB_TOKEN']) || 'xxxxxxxxxxxxxx'
};

