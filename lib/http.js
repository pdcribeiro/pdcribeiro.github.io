export default {
  async postJson({ url, query = null, headers = null, body = null }) {
    console.debug('[http] postJson() call');
    let fullUrl = url;
    if (query) {
      fullUrl += '?' + new URLSearchParams(query).toString();
    }
    const response = await fetch(fullUrl, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    });
    const json = await response.json();
    return json;
  },
};
