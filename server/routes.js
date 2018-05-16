const request = require('request');
const bodyParser = require('body-parser');
const variables = require('./config.js');
const data = require('./entities.json');
const journal_data = require('./journal.json');

module.exports = app => {
	app.use(bodyParser.json());       // to support JSON-encoded bodies

	app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	  extended: true
	}));

	app.get('/', (req, res) => {
		res.sendfile('./client/index.html');
	});

	app.get('/entities', (req, res) => {
		res.json(data);
	});

	app.get('/journal', (req, res) => {
		res.json(journal_data)
	});

};
