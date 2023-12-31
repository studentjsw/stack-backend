const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    questionTitle: { type: String, required: "Question must have a title" },
    questionBody: { type: String, required: "Question must have a body" },
    questionTags: { type: [String], required: "Question must have a tags" },
    upVote: { type: [String], default: [] },
    downVote: { type: [String], default: [] },
    userPosted: { type: String, required: true },
    userId: { type: String, required: true },
    askedOn: { type: Date, default: Date.now },
    answer: [
      {
        answerBody: String,
        userAnswered: String,
        userId: String,
        answeredOn: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Questions = mongoose.model("Questions", QuestionSchema);

module.exports = { Questions };