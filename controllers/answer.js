const mongodb = require("mongodb");
var { Questions } = require("../models/question");

const answer = {
  postAnswer: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { answerBody } = req.body;
      const userAnswered = req.user.displayName;

      const question = await Questions.findOne({ _id: mongodb.ObjectId(id) });

      if (String(question._id === id)) {
        let addAnswer = await Questions.findOneAndUpdate(
          { _id: mongodb.ObjectId(id) },
          {
            $push: {
              answer: {
                answerBody,
                userAnswered,
                userId,
                answeredOn: Date.now(),
              },
            },
          }
        );

        // console.log(addAnswer);
        res.send({
          statusCode: 200,
          message: "Answer Added Successfully",
        });
      } else {
        res.send({
          statusCode: 400,
          message: "Question not found",
        });
      }
    } catch (error) {
      res.send({
        statusCode: 500,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  },

  deleteAnswer: async (req, res) => {
    const userId = req.user.id;
    const { id: _id } = req.params;
    const { answerId } = req.body;
    const answer = await Questions.findOne({ _id });
    try {
      if (answer.userId === userId) {
        await Questions.updateOne(
          { _id: mongodb.ObjectId(_id) },
          {
            $pull: { answer: { _id: mongodb.ObjectId(answerId) } },
          }
        );
        res.send({
          statusCode: 200,
          message: "Successfully deleted",
        });
      } else {
        res.send({
          statusCode: 400,
          message: "Not authorized",
        });
      }
    } catch (error) {
      res.send({
        statusCode: 500,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  },
};

module.exports = answer;

// deleteAnswer: async (req, res) => {
//   const { id: _id } = req.params;
//   const { answerId, noOfAnswers } = req.body;

//   if (!mongoose.Types.ObjectId.isValid(_id)) {
//     return res.status(404).send("Question unavailable...");
//   }
//   if (!mongoose.Types.ObjectId.isValid(answerId)) {
//     return res.status(404).send("Answer unavailable...");
//   }
//   updateNoOfQuestions(_id, noOfAnswers);
//   try {
//     await Questions.updateOne(
//       { _id },
//       { $pull: { answer: { _id: answerId } } }
//     );
//     res.status(200).json({ message: "Successfully deleted..." });
//   } catch (error) {
//     res.status(405).json(error);
//   }
// };