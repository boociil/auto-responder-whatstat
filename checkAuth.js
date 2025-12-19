// checkAuth.js
require("dotenv").config();
const SECRET_PASSWORD = process.env.REKAP_PASSWORD;

function checkAuth(req, res, next) {
  const password = req.headers['x-password'];

  if (password !== SECRET_PASSWORD || password  == undefined) {
    return res.status(401).json({"error": "Unauthorized" });
  }

  next();
}

function authWablas(req, res, next) {
  const authorization = req.headers['authorization'];

  if (authorization !== process.env.WABLAS_TOKEN || authorization  == undefined) {
    return res.status(401).json({"error": "Unauthorized" });
  }

  next();
}

module.exports = { checkAuth, authWablas };
