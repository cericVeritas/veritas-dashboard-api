
process.env.TZ = "UTC";
require("dotenv").config();
require = require("esm-wallaby")(module);
module.exports = require("./app.js");
