import http from './http.js';

let accessToken, baseUrl_;

export default {
  async connect({ authUrl, apiKey, baseUrl }) {
    if (!authUrl) {
      throw new Error('Missing DB auth URL');
    }
    if (!apiKey) {
      throw new Error('Missing DB API key');
    }
    if (!baseUrl) {
      throw new Error('Missing DB base URL');
    }
    accessToken = await fetchAccessToken(authUrl, apiKey);
    baseUrl_ = baseUrl;
    // await migrate();
  },
  async req(collection, action, body) {
    console.log('db.req()', { body });
    if (!accessToken) {
      throw new Error('Please authenticate before calling the DB');
    }
    const response = await http.postJson({
      url: `${baseUrl_}/action/${action}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        ...body,
        dataSource: 'Cluster0',
        database: 'flashcards',
        collection,
      },
    });
    return response;
  },
};

async function fetchAccessToken(url, key) {
  console.log('db.fetchAccessToken()');
  const response = await http.postJson({
    url,
    body: { key },
  });
  return response.access_token;
}
