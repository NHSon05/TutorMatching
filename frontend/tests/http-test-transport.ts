// Keep assertions readable while exercising Axios's real fetch adapter and Request serialization.
export function fetchTransport(send: typeof fetch): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    return send(request.url, {
      method: request.method,
      credentials: request.credentials,
      cache: request.cache,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.body ? await request.text() : undefined,
      signal: request.signal,
    });
  };
}
