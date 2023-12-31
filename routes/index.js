var express = require("express");
var router = express.Router();
const answer = require("../controllers/answer");
const question = require("../controllers/question");
const userController = require("../controllers/userController");
const { default: mongoose } = require("mongoose");
const { validate, auth } = require("../auth");
const { DBURL } = process.env;

mongoose.connect(process.env.DBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  
})
.then(()=>console.log('Connected to db'))
.catch((err)=> console.log("DB connection error",err));

router.get("/", function (_, res, _) {
  res.render("index", { title: "Stack Overflow Clone" });
});

//user
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/forgot_password", userController.forgot);
router.post("/reset_password", auth.access, userController.reset);
router.patch("/update/:id", auth.login, validate, userController.update);
router.get("/profile/:id", auth.login, validate, userController.details);

//question
router.post(
  "/questions/postQuestion",
  auth.login,
  validate,
  question.postQuestion
);
router.get("/questions/getAll", question.getAllQuestions);
router.get("/questions/get/:id", question.getById);
router.delete(
  "/questions/delete/:id",
  auth.login,
  validate,
  question.deleteById
);
router.put("/questions/edit/:id", auth.login, validate, question.editById);
router.patch("/questions/vote/:id", auth.login, validate, question.vote);
router.get("/questions/unAnswered", question.unAnswered);

//answer
router.patch(
  "/answers/postAnswer/:id",
  auth.login,
  validate,
  answer.postAnswer
);

router.patch("/answer/delete/:id", auth.login, validate, answer.deleteAnswer);

module.exports = router;