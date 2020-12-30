import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, split } from 'apollo-boost';
// WebSocketLink class is need to open a websocket
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import { getAccessToken } from '../auth';

const httpUrl = 'http://localhost:9000/graphql';
// wsUrl is a different protocol from http and needed to make a socket connection
const wsUrl = 'ws://localhost:9000/graphql';

const httpLink = ApolloLink.from([
  new ApolloLink((operation, forward) => {
    const token = getAccessToken();
    if (token) {
      operation.setContext({ headers: { authorization: `Bearer ${token}` } });
    }
    return forward(operation);
  }),
  new HttpLink({ uri: httpUrl }),
]);

const wsLink = new WebSocketLink({
  uri: wsUrl,
  options: {
    // lazy true means the app will only make websocket connection when the user
    // request a websocket subscription
    lazy: true,
    // reconnect means that if a socket is interupted for some reason it will reconnect
    reconnect: true,
  },
});

function isSubscription(operation) {
  const definition = getMainDefinition(operation.query);
  return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
}

const client = new ApolloClient({
  cache: new InMemoryCache(),
  // We use the split function because we cant simply replace the httpLink with the wsLink
  // split works similar to an ifStatement function isSubscription checks what type of
  // request is being made
  link: split(isSubscription, wsLink, httpLink),
  defaultOptions: { query: { fetchPolicy: 'no-cache' } },
});

export default client;
