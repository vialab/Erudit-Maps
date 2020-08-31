const request = require("request");
const callReferenceTimer = require("./api_call_restriction");

login = {
  username: "chriscollins",
  password: "AKIAQKHU4SOSFAWG7UQP"
};

var jwt_token;

var api_url = "https://runtime.dimensions.ai/api/dsl.json";

var timer = new callReferenceTimer();

request.post(api_url, login, function(error, resp) {
  if (error) {
    throw error;
  }

  let cacheToken = resp.toJSON()["token"];
  if (cacheToken != null) {
    console.log(cacheToken);
    jwt_token = { Authorization: "JWT " + cacheToken };
  } else {
    console.log("Error getting token.");
  }
});

const queryDimensions = async (req, resp) => {
  if (timer.incrementCalls()) {
    request.post(
      { url: api_url, data: req, headers: jwt_token },
      (res, error) => {
        if (error) {
          throw error;
        }
        resp.send(res);
      }
    );
  }
};

module.export = { queryDimensions };
