'use strict';

const Hapi = require('hapi');
const Joi = require('joi');

const server = new Hapi.Server();

server.connection({
  host: 'localhost',
  port: 3000
});

server.route({
  method: 'GET',
  path: '/',
  handler(request, reply) {
    reply('Hello, world!');
  }
});

server.route({
  method: 'GET',
  path: '/users/{name?}',
  handler(request, reply) {
    if (request.params.name) {
      reply(encodeURIComponent(request.params.name));
    } else {
      reply('Anonymous');
    }
  },
  config: {
    validate: {
      params: {
        name: Joi.number()
      }
    }
  }
});

server.route({
  method: 'GET',
  path: '/photos/{name}.jpg',
  handler(request, reply) {
    reply(encodeURIComponent(request.params.name));
  }
});

server.route({
  method: 'GET',
  path: '/search',
  handler(request, reply) {
    reply(request.query);
  },
  config: {
    validate: {
      query: {
        text: Joi.string().required(),
        page: Joi.number().default(1),
        lang: Joi.only(['pl', 'gb', 'de']).default('pl')
      }
    }
  }
});



// aplikacja
const contacts = [];

server.route({
  method: 'GET',
  path: '/contacts',
  handler(request, reply) {
    reply({
      contacts
    });
  }
});

server.route({
  method: 'POST',
  path: '/contacts',
  config: {
    validate: {
      payload: Joi.object({
        contact: Joi.object({
          name: Joi.string().required(),
          surname: Joi.string().required()
        }).required()
      })
    }
  },
  handler(request, reply) {
    const contact = request.payload.contact;
    contacts.push(contact);
    reply({contact}).code(201);
  }
});



server.start((err) => {
  if (err) {
    throw err;
  }

  console.log(`Server running at ${server.info.uri}`);
});
