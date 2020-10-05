if (typeof(PhusionPassenger) !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false });
}

const express = require('express');
const Sentry = require('@sentry/node');
const compression = require('compression');
const morgan  = require('morgan');
const { ApolloServer } = require('apollo-server-express');
const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");

const CLIENT_API_URL = process.env.CLIENT_API_URL || 'https://api.stage.datacite.org/client-api/graphql';
// const PROFILES_URL = process.env.PROFILES_URL || 'https://api.stage.datacite.org/profiles/graphql';
// const API_URL = process.env.API_URL || 'https://api.stage.datacite.org/api/graphql';
// const RE3DATA_URL = process.env.RE3DATA_URL || 'https://api.stage.datacite.org/re3data/graphql';
// const STRAPI_URL = process.env.STRAPI_URL || 'https://strapi.stage.datacite.org/graphql';

class AuthenticationHeader extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {
    // Pass the token from the context to underlying services
    // via the authorization header
    request.http.headers.set('authorization', context.token);
  }
}

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'client-api', url: CLIENT_API_URL },
    // { name: 'profiles', url: PROFILES_URL },
    // { name: 'strapi', url: STRAPI_URL }
    // { name: 'api', url: API_URL },
    // { name: 're3data', url: RE3DATA_URL }
    // more services
  ],
  buildService({ name, url }) {
    return new AuthenticationHeader({ url });
  },
});

const server = new ApolloServer({
  gateway,
  cors: false,
  subscriptions: false,
  introspection: true,
  tracing: true,
  engine: {
    apiKey: process.env.APOLLO_API_KEY,
    graphVariant: process.env.NODE_ENV
  },
  playground: {
    settings: {
      'editor.theme': 'light',
    }
  },
  context: ({ req }) => {
    // Get the user token from the headers
    const token = req.headers.authorization || '';
    // Add the token to the context
    return { token };
  },
});

let app = express();

Sentry.init({ dsn: process.env.SENTRY_DSN });

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// The error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

// compress responses
app.use(compression());

// logging
app.use(morgan('combined'));

server.applyMiddleware({ app, cors: false });

// disable headers
app.disable('x-powered-by');

if (typeof(PhusionPassenger) !== 'undefined') {
  app.listen('passenger');
} else {
  app.listen(4000);
}
 