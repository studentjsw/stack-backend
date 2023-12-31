const mongodb = require("mongodb");
var { Questions } = require("../models/question");

const question = {
  postQuestion: async (req, res) => {
    try {
      const { questionTitle, questionBody, questionTags } = req.body;
      const userId = req.user.id;
      const userName = req.user.displayName;
      const queExist = await Questions.find({
        questionTitle,
      });
      const bodyExist = await Questions.find({
        questionBody,
      });
      if (userId) {
        if (!queExist && !bodyExist) {
          const postQuestion = new Questions({
            questionTitle,
            questionBody,
            questionTags,
            userId,
            userPosted: userName,
          });
          await postQuestion.save();
          res.json({
            statusCode: 200,
            message: "Question posted successfully",
          });
        } else {
          res.json({
            statusCode: 400,
            message: "Find the relevant question below",
            question: {
              ...bodyExist,
              ...queExist,
            },
          });
        }
      } else {
        res.json({ statusCode: 400, message: "Not Authorized" });
      }
    } catch (error) {
      // console.log(error);
      res.status(500).send(error.message);
    }
  },

  getAllQuestions: async (req, res) => {
    try {
      const allQuestions = await Questions.find();
      res.json({
        statusCode: 200,
        allQuestions,
      });
    } catch (error) {
      // console.log(error);
      res.json({
        statusCode: 404,
        message: error.message,
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id: _id } = req.params;
      const question = await Questions.findOne({ _id: _id });
      if (question) {
        res.json({
          statusCode: 200,
          question,
        });
      }
    } catch (error) {
      res.json({
        statusCode: 500,
        message: "Internal Server Error",
      });
    }
  },

  deleteById: async (req, res) => {
    const { id: _id } = req.params;
    const userId = req.user.id;

    const question = await Questions.findOne({
      _id: mongodb.ObjectId(_id),
    });

    try {
      if (question.userId === userId) {
        await Questions.findByIdAndRemove(_id);
        res.json({
          statusCode: 200,
          message: "Question deleted successfully",
        });
      }
    } catch (error) {
      res.json({
        statusCode: 404,
        message: error.message,
      });
    }
  },

  editById: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id: _id } = req.params;
      const { questionTitle, questionBody, questionTags } = req.body;
      const question = await Questions.findOne({ _id: mongodb.ObjectId(_id) });
      console.log(question);
      if (question.userId === userId) {
        let result = await Questions.findOneAndUpdate(
          { _id: mongodb.ObjectId(_id) },
          { questionTitle, questionBody, questionTags }
        );
        res.send({
          statusCode: 200,
          message: "Question Edited Successfully",
          result,
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

  vote: async (req, res) => {
    try {
      const userId = req.user.id;
      const { value } = req.body;
      const { id } = req.params;

      const question = await Questions.findOne({ _id: id });

      // console.log("UserId: " + userId, "ID:" + id, "Question:" + question);

      const upVote = question.upVote.findIndex((id) => id === String(userId));
      const downVote = question.downVote.findIndex(
        (id) => id === String(userId)
      );

      if (String(question._id) === id) {
        if (value === "positive") {
          if (downVote !== -1) {
            question.downVote = question.downVote.filter(
              (id) => id !== String(userId)
            );
          }
          if (upVote === -1) {
            question.upVote.push(userId);
          } else {
            question.upVote = question.upVote.filter(
              (id) => id !== String(userId)
            );
          }
        } else if (value === "negative") {
          if (upVote !== -1) {
            question.upVote = question.upVote.filter(
              (id) => id !== String(userId)
            );
          }
          if (downVote === -1) {
            question.downVote.push(userId);
          } else {
            question.downVote = question.downVote.filter(
              (id) => id !== String(userId)
            );
          }
        }

        await Questions.findByIdAndUpdate(
          { _id: mongodb.ObjectId(id) },
          question
        );

        res.send({
          statusCode: 200,
          message: "Vote Successful",
        });
      } else {
        res.send({
          statusCode: 400,
          message: "Question ID not found",
        });
      }
    } catch (error) {
      res.json({
        statusCode: 500,
        message: error.message,
      });
    }
  },

  unAnswered: async (req, res) => {
    try {
      const questions = await Questions.find({});
      // console.log(questions);
      let unAnswered = [];
      let answered = [];
      questions.map((question) => {
        if (question.answer.length === 0) {
          unAnswered.push(question);
        } else if (question.answer.length > 0) {
          answered.push(question);
        }
      });
      res.send({
        statusCode: 200,
        unAnswered,
        answered,
      });
    } catch (error) {
      res.send({
        statusCode: 500,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  },
};

module.exports = question;