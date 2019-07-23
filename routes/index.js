const express = require("express");
const router = express.Router();

var io = require("../app");

const { ensureAuthenticated } = require("../config/auth");

router.get("/", (req, res) => res.render("login"));
router.get("/dashboard", ensureAuthenticated, (req, res) => {
  res.render("dashboard", {
    name: req.user.name
  });
});

// Download Chat
router.get("/download", ensureAuthenticated, function(req, res) {
  var file = __dirname + "/chatlog.txt";
  res.download(file); // Set disposition and send it.
});

module.exports = router;
