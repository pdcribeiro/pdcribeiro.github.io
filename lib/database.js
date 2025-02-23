import http from '/lib/http.js';
import store from '/lib/store.js';

const _30_MINUTES_IN_MS = 30 * 60 * 1000;
const _60_DAYS_IN_MS = 60 * 24 * 60 * 60 * 1000;
const REFRESH_INTERVAL_FACTOR = 0.97;
const ACCESS_TOKEN_LIFETIME = _30_MINUTES_IN_MS * REFRESH_INTERVAL_FACTOR;
const REFRESH_TOKEN_LIFETIME = _60_DAYS_IN_MS * REFRESH_INTERVAL_FACTOR;

const REFRESH_ENDPOINT_PATH = '/api/client/v2.0/auth/session';
const CLUSTER_NAME = 'Cluster0';
const MIGRATIONS_COLLECTION = '_migrations';

export function getDatabase(databaseName) {
  let config, authTokens;

  const db = {
    async connect(configArg, migrations) {
      checkConfig(configArg);
      config = configArg;
      await authenticate();
      await applyPendingMigrations(migrations);
    },
    async findMany(collection, options) {
      const { documents } = await req(collection, 'find', options);
      return documents.map(parseId);
    },
    async findOne(collection, id) {
      const { document } = await req(collection, 'findOne', { filter: { _id: { $oid: id } } });
      return parseId(document);
    },
    async insertOne(collection, data) {
      await req(collection, 'insertOne', { document: data });
      console.debug('[database] document inserted', { collection });
    },
    async updateOne(collection, id, data) {
      await req(collection, 'updateOne', { filter: { _id: { $oid: id } }, update: { $set: { ...data, id: undefined } } });
      console.debug('[database] document updated', { collection, id });
    },
    async updateMany(collection, { filter, update }) {
      await req(collection, 'updateMany', { filter, update });
      console.debug('[database] documents updated', { collection, filter });
    },
    async deleteOne(collection, id) {
      await req(collection, 'deleteOne', { filter: { _id: { $oid: id } } });
      console.debug('[database] document deleted', { collection, id });
    },
  };

  return db;

  async function authenticate() {
    const tokensStoreKey = `${databaseName}-database-auth-tokens`;
    authTokens = store.get(tokensStoreKey);

    if (!authTokens || isExpired(authTokens.refreshToken)) {
      authTokens = await fetchAuthTokens(config);
    } else if (isExpired(authTokens.accessToken)) {
      authTokens.accessToken = await refreshAccessToken(config, authTokens.refreshToken.token);
    }
    store.set(tokensStoreKey, authTokens);

    const nextExpiresAt = Math.min(
      authTokens.refreshToken.expiresAt,
      authTokens.accessToken.expiresAt
    );
    setTimeout(authenticate, nextExpiresAt - Date.now());
  }

  async function applyPendingMigrations(migrations) {
    console.debug('[database] applying pending migrations');
    checkConnection();
    const [lastMigration] = await db.findMany(MIGRATIONS_COLLECTION, {
      sort: { timestamp: -1 },
      limit: 1,
    });
    const sortedMigrations = migrations
      .reverse()
      .filter((m) => m.timestamp)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const startIndex = lastMigration
      ? sortedMigrations.findIndex((m) => new Date(m.timestamp) > new Date(lastMigration.timestamp))
      : 0;
    const pendingMigrations = startIndex === -1 ? [] : sortedMigrations.slice(startIndex);
    for (const { migrate, timestamp } of pendingMigrations) {
      await migrate();
      await db.insertOne(MIGRATIONS_COLLECTION, { timestamp });
    }
    console.debug(`[database] applied ${pendingMigrations.length} migrations`);
  }

  function checkConnection() {
    const isConnected = config && authTokens && Date.now() < authTokens.accessToken.expiresAt;
    if (!isConnected) {
      throw new Error('[database] not connected');
    }
  }

  async function req(collection, action, body) {
    console.debug('[database] sending request', { body });
    checkConnection();
    const response = await http.postJson({
      url: `${config.baseUrl}/action/${action}`,
      headers: {
        Authorization: `Bearer ${authTokens.accessToken.token}`,
      },
      body: {
        ...body,
        dataSource: CLUSTER_NAME,
        database: databaseName,
        collection,
      },
    });
    return response;
  }
};

function checkConfig(config) {
  if (!config.authUrl) {
    throw new Error('[database] missing auth URL');
  }
  if (!config.apiKey) {
    throw new Error('[database] missing API key');
  }
  if (!config.baseUrl) {
    throw new Error('[database] missing base URL');
  }
};

function isExpired(token) {
  return Date.now() > token.expiresAt;
}

async function fetchAuthTokens(config) {
  console.debug('[database] fetching authentication tokens');
  const response = await http.postJson({
    url: config.authUrl,
    body: { key: config.apiKey },
  });
  if (!response.access_token) {
    throw new Error('[database] failed to fetch authentication tokens');
  }
  return {
    accessToken: getAccessTokenWithExpiration(response.access_token),
    refreshToken: {
      token: response.refresh_token,
      expiresAt: Date.now() + REFRESH_TOKEN_LIFETIME,
    }
  };
}

async function refreshAccessToken(config, refreshToken) {
  console.debug('[database] refreshing access token');
  const response = await http.postJson({
    url: new URL(config.authUrl).origin + REFRESH_ENDPOINT_PATH,
    headers: {
      Authorization: `Bearer ${refreshToken}`
    }
  });
  if (!response.access_token) {
    throw new Error('[database] failed to refresh access token');
  }
  return getAccessTokenWithExpiration(response.access_token);
}

function getAccessTokenWithExpiration(token) {
  return {
    token,
    expiresAt: Date.now() + ACCESS_TOKEN_LIFETIME,
  };
}

function parseId({ _id, ...rest }) {
  return { id: _id, ...rest };
}
