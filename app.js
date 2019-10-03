if (typeof(PhusionPassenger) !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false });
}

const express = require('express');
const Sentry = require('@sentry/node');
const compression = require('compression');
const morgan  = require('morgan');
const { ApolloServer } = require('apollo-server-express');
const { ApolloGateway } = require("@apollo/gateway");

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'profiles', url: 'https://api.test.datacite.org/people/graphql' },
    { name: 'dois', url: 'https://api.test.datacite.org/doi/graphql' }
    // more services
  ],
});
 
const server = new ApolloServer({
  gateway,
  subscriptions: false,
  introspection: true,
  playground: {
    settings: {
      'editor.theme': 'light',
    }
  }
});

let app = express();

Sentry.init({ dsn: 'https://bd7b12de55984fdcb8b1a26f73d1901e@sentry.io/1767721' });

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
 