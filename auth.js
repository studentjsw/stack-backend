var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");

const saltRounds = 12;

const { LOGIN_KEY, REFRESH_KEY, ACCESS_KEY } = process.env;

async function hashPassword(password) {
  var salt = await bcrypt.genSalt(saltRounds);
  var hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

async function hashCompare(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

let createToken = {
  login: (data) => {
    return jwt.sign(data, LOGIN_KEY, { expiresIn: "8h" });
  },

  refresh: (payload) => {
    return jwt.sign(payload, REFRESH_KEY, { expiresIn: "24h" });
  },

  access: (payload) => {
    return jwt.sign(payload, ACCESS_KEY, { expiresIn: "15m" });
  },
};

function validate(req, res, next) {
  // console.log(req.headers);
  const token = req.headers.authorization.split(" ")[1];
  let data = jwt.decode(token);
  // console.log(data);
  if (Math.round(+new Date() / 1000) < data.exp) {
    next();
  } else {
    res.status(400).send({
      message: "Invalid Token or Token expired",
    });
  }
}

const auth = {
  login: (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, process.env.LOGIN_KEY, (err, user) => {
        if (err)
          return res.status(400).send({
            message: "Authentication failed in login token",
          });
        // success:
        // console.log(req.user);
        req.user = user;
        next();
      });
    } catch (error) {
      res.status(500).send(error.message);
    }
  },
  access: (req, res, next) => {
    try {
      // check ac token
      const token = req.header("Authorization");
      // console.log(token, "Token Authentication");
      if (!token)
        return res.status(400).json({ msg: "Authentication failed." });

      // validate
      jwt.verify(token, process.env.ACCESS_KEY, (err, user) => {
        if (err) return res.status(400).json({ msg: "Authentication failed." });

        // success
        req.user = user;
        // console.log(req.user);
        next();
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
};

module.exports = { hashPassword, hashCompare, createToken, validate, auth };