import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import fetch from 'isomorphic-unfetch'

const httpLink = createHttpLink({
  uri: 'https://graphql.fauna.com/graphql', // Server URL (must be absolute)
  fetch,
});

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem('token');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token
        ? `Bearer ${token}`
        : `Bearer ${process.env.FAUNADB_KEY}`,
      'Content-type': 'application/json',
      Accept: 'application/json',
    },
  };
});

export default function createApolloClient(initialState, ctx) {
  // The `ctx` (NextPageContext) will only be present on the server.
  // use it to extract auth headers (ctx.req) or similar.
  return new ApolloClient({
    ssrMode: Boolean(ctx),
    link: authLink.concat(httpLink),
    cache: new InMemoryCache().restore(initialState),
  });
}
