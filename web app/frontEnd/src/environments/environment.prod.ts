// Configuration de l'environnement de production
declare const process: any;

export const environment = {
  production: true,
  apiUrl: 'http://localhost:8000',
  githubToken: (typeof process !== 'undefined' && process.env && process.env['NG_APP_GITHUB_TOKEN']) || ''
};

