if (typeof(PhusionPassenger) !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false });
}

const express = require('express');
const Sentry = require('@sentry/node');
const compression = require('compression');
const morgan  = require('morgan');
const { ApolloServer } = require('apollo-server-express');
const { ApolloGateway } = require("@apollo/gateway");

const PROFILES_URL = process.env.PROFILES_URL || 'https://api.test.datacite.org/profiles/graphql';
const CLIENT_API_URL = process.env.CLIENT_API_URL || 'https://api.test.datacite.org/client-api/graphql';
const API_URL = process.env.API_URL || 'https://api.test.datacite.org/api/graphql';

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'profiles', url: PROFILES_URL },
    { name: 'client-api', url: CLIENT_API_URL },
    { name: 'api', url: API_URL }
    // more services
  ],
});
 
const server = new ApolloServer({
  gateway,
  subscriptions: false,
  introspection: true,
  tracing: true,
  engine: {
    apiKey: process.env.APOLLO_API_KEY,
    schemaTag: process.env.NODE_ENV
  },
  playground: {
    settings: {
      'editor.theme': 'light',
    }
  }
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

server.applyMiddleware({ app });

if (typeof(PhusionPassenger) !== 'undefined') {
  app.listen('passenger');
} else {
  app.listen(3000);
}
 