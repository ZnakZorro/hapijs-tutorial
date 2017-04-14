'use strict';

const Hapi = require('hapi');
const Joi = require('joi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');

const pkg = require('./package.json');

const options = {
  info: {
    title: pkg.description,
    version: pkg.version
  },
  jsonEditor: false
};

const server = new Hapi.Server();

server.connection({
  host: 'localhost',
  port: 3000
});

server.route({
  method: 'GET',
  path: '/',
  config: {
    tags: ['api'],
  },
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
    tags: ['api'],
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
  config: {
    tags: ['api'],
  },
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
    tags: ['api'],
    validate: {
      query: {
        text: Joi.string().required(),
        page: Joi.number().integer().default(1),
        lang: Joi.only(['pl', 'gb', 'de']).default('pl')
      }
    }
  }
});


// aplikacja
const contacts = [];

const Contact = Joi.object({
  name: Joi.string().required().example('Jan').description(`Contact's name`),
  surname: Joi.string().required().example('Kowalski').description(`Contact's surname`)
}).label('Contact');

const ContactResponseSchema = Joi.object({
  contact: Contact.required()
}).required().label('ContactResponseSchema');

const ContactsResponseSchema = Joi.object({
  contacts: Joi.array().items(Contact).label('Contacts')
}).required().label('ContactsSchema');

server.route({
  method: 'GET',
  path: '/contacts',
  config: {
    tags: ['api'],
    description: 'Returns added contacts',
    response: {
      status: {
        200: ContactsResponseSchema
          .example({contacts: [{name: 'Jan', surname: 'Kowalski'}, {name: 'Daniel', surname: 'Nowak'}]})
      }
    }
  },
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
    tags: ['api'],
    description: 'Create a new contact',
    notes: 'Returns created contact',
    validate: {
      payload: ContactResponseSchema
    },
    response: {
      status: {
        201: ContactResponseSchema.description('Contact created'),
      }
    },
    plugins: {
      'hapi-swagger': {
        responses: {
          400: {
            description: 'Bad request'
          },
          409: {
            description: 'User with given name/surname exists'
          }
        }
      }
    },
  },
  handler(request, reply) {
    const contact = request.payload.contact;

    const userExists = contacts.find(c => c.name === contact.name && c.surname === contact.surname);
    if (userExists) {
      return reply('This user exists!').code(409);
    }

    contacts.push(contact);
    reply({contact}).code(201);
  }
});

server.register([
  Inert,
  Vision,
  {register: HapiSwagger, options}
], err => {
  if (err) {
    throw err;
  }

  server.start((err) => {
    if (err) {
      throw err;
    }

    console.log(`Server running at ${server.info.uri}`);
  });
});
