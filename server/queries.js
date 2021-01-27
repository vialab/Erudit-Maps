const fetch = require("node-fetch");
const callReferenceTimer = require("./api_call_restriction");

var login = { key: "0C3C6735217A4B159E0FA5CA270A65B6" };

var jwt_token;

var timer = new callReferenceTimer();

fetch('https://app.dimensions.ai/api/auth.json', {
  method: "POST",
  body: JSON.stringify(login),
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "python-requests/2.23.0"
  }
}).then(response => response.json())
  .then(data => {
    //console.log('Success:', data);
    jwt_token = data;
    //queryDimensions('search publications return publications');
  })
  .catch(error => console.error('Error:', error));

const queryDimensions = async (req, resp) => {
  if (timer.incrementCalls()) {
    fetch("https://app.dimensions.ai/api/dsl.json", {
      method: "POST",
      body: req,
      headers: {
        'Authorization': "JWT " + jwt_token['token'],
        "User-Agent": "python-requests/2.23.0"
      }
    }).then(response => response.json())
      .then(body => {
        resp.send(res);
        //console.log("DSL: ", body)
      })
      .catch(error => console.error('Error:', error));
  }
};

module.export = { queryDimensions };
