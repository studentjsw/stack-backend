const { hashPassword, hashCompare, createToken } = require("../auth");
const { UserDetails, SessionDetails } = require("../models/user");
const sendMail = require("../helpers/sendMail");
const bcrypt = require("bcryptjs");
const mongodb = require("mongodb");

const userController = {
  signup: async (req, res) => {
    try {
      let { displayName, email, password } = req.body;
      // check all fields
      if (!displayName || !email || !password)
        return res.json({
          statusCode: 400,
          message: "Please fill all fields.",
        });

      if (displayName.length < 6) {
        return res.json({
          statusCode: 400,
          message: "Name must be at least 6 characters long.",
        });
      }

      if (password.length < 8) {
        return res.json({
          statusCode: 400,
          message: "Password must be at least 8 characters long.",
        });
      }

      let user = await UserDetails.findOne({ email: email });
      if (user) {
        res.json({
          statusCode: 400,
          message: "User already exists",
        });
      } else {
        let hashed = await hashPassword(password);
        user = await UserDetails.create({
          displayName,
          email,
          password: hashed,
        });
        res.json({
          statusCode: 200,
          message: "Successfully created user",
        });
      }
    } catch (error) {
      // console.log(error);
      res.json({
        statusCode: 500,
        message: "Internal Server Error",
        error,
      });
    }
  },

  login: async (req, res) => {
    try {
      let user = await UserDetails.findOne({ email: req.body.email });
      // console.log(user);
      if (user) {
        if (await hashCompare(req.body.password, user.password)) {
          {
            let token = createToken.login({
              id: user._id,
              displayName: user.displayName,
            });
            await SessionDetails.create({
              userId: user._id,
              displayName: user.displayName,
              token: token,
            });

            const rf_token = createToken.refresh({ id: user._id });
            res.cookie("_apprftoken", rf_token, {
              httpOnly: true,
              path: "/access",
              maxAge: 24 * 60 * 60 * 1000, // 24h
            });
            res.json({
              statusCode: 200,
              message: "successfully logged",
              token,
              user,
            });
          }
        } else {
          res.json({
            statusCode: 400,
            message: "The email or password is incorrect",
          });
        }
      } else {
        res.json({
          statusCode: 401,
          message: "User account not found",
        });
      }
    } catch (error) {
      // console.log(error);
      res.json({
        statusCode: 500,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  },

  forgot: async (req, res) => {
    try {
      // get mail from body
      const { email } = req.body;

      // verify email
      const user = await UserDetails.findOne({ email: email });
      if (!user)
        return res.json({ statusCode: 400, message: "Check your email" });

      //create access token
      const access_token = createToken.access({
        id: user.id,
        email: user.email,
      });

      //send mail
      const url = `http://localhost:3000/reset_password/${access_token}`;
      const name = user.displayName;
      sendMail.sendEmailReset(email, url, "Reset your password", name);

      // success
      res.json({
        statusCode: 200,
        message: "Password reset link sent! please check your mail",
        access_token,
      });
    } catch (error) {
      res.json({
        statusCode: 500,
        message: error.message,
      });
    }
  },

  reset: async (req, res) => {
    try {
      // get token from headers
      let access_token = req.headers.authorization;
      //console.log(req.headers.authorization);

      // get password from body.
      const { password } = req.body;

      // hash password
      const salt = await bcrypt.genSalt(12);
      const hashPassword = await bcrypt.hash(password, salt);

      //get user from db
      const dbUser = await UserDetails.findOne({ _id: req.user.id });

      // compare new pw and db pw
      const comparison = await bcrypt.compare(password, dbUser.password);

      if (access_token) {
        if (password === "") {
          res.json({ statusCode: 400, message: "Password Required" });
        }

        if (password.length < 8) {
          return res.json({
            statusCode: 400,
            message: "Password must be at least 8 characters long.",
          });
        }

        if (!comparison) {
          // update password
          await UserDetails.findOneAndUpdate(
            { _id: req.user.id },
            { $set: { password: hashPassword } }
          );
          // reset success
          res.json({
            statusCode: 200,
            message: "Password reset successfully",
          });
        } else {
          res.json({
            statusCode: 400,
            message: "New Password should be different from old password",
          });
        }
      } else {
        res.json({
          statusCode: 400,
          message: "Invalid Token",
        });
      }
    } catch (error) {
      // console.log(error);
      res.json({
        statusCode: 500,
        message: error.message,
      });
    }
  },

  details: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const user = await UserDetails.findOne({
        _id: mongodb.ObjectId(id),
      });

      if (String(user._id) === userId) {
        res.send({
          statusCode: 200,
          user,
        });
      } else {
        res.send({
          statusCode: 400,
          message: "Not Authorized",
        });
      }
    } catch (error) {
      res.json({
        statusCode: 500,
        message: error.message,
      });
    }
  },

  update: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id: _id } = req.params;
      const { displayName, about, tags } = req.body;

      const userDetails = await UserDetails.findOne({
        _id: mongodb.ObjectId(_id),
      });

      if (String(userDetails._id) === userId) {
        const updatedProfile = await UserDetails.findByIdAndUpdate(
          _id,
          { $set: { displayName: displayName, about: about, tags: tags } },
          { new: true }
        );
        res.json({
          statusCode: 200,
          message: "User Details Updated",
          updatedProfile,
        });
      } else {
        res.json({
          statusCode: 404,
          message: "User not found",
        });
      }
    } catch (error) {
      res.json({
        statusCode: 500,
        message: error.message,
      });
    }
  },
};

module.exports = userController;