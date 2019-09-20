const request = require("request");
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
    login = {
      username: "chriscollins",
      password: "AKIAQKHU4SOSFAWG7UQP"
    };
    request.post("https://runtime.dimensions.ai/api/dsl.json", login, function(
      error,
      resp,
      body
    ) {
      if (error) {
        throw error;
      }
      console.log(resp.toJSON());
    });
  });
};
