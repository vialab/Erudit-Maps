const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const data = require("./entities.json");
const journal_data = require("./journal.json");
const { queryDimensions } = require("./queries");
const callReferenceTimer = require("./api_call_restriction");

var callReference = new callReferenceTimer();

module.exports = app => {
  app.use(bodyParser.json()); // to support JSON-encoded bodies

  app.use(
    bodyParser.urlencoded({
      // to support URL-encoded bodies
      extended: true
    })
  );

  app.get("/", (req, res) => {
    res.sendfile("./client/index.html");
  });

  app.get("/entities", (req, res) => {
    res.json(data);
  });

  app.get("/journal", (req, res) => {
    res.json(journal_data);
  });

  app.get("/test", (req, resp) => {
    login = { key: "0C3C6735217A4B159E0FA5CA270A65B6" };

    fetch('https://app.dimensions.ai/api/auth.json', {
      method: "POST",
      body: JSON.stringify(login),
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "python-requests/2.23.0"
      }
    }).then(res => res.json())
      .catch(error => console.error('Error:', error));
  });
};
