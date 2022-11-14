export const API_URL = process.env.DEBUG
  ? 'http://localhost:5007'
  : 'https://api.animaapp.com';
export const STORYBOOK_SERVICE_BASE_URL = `${API_URL}/services/s2f`;
