const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");

// User model
const User = require("../models/User");

// Login Page
router.get("/login", (req, res) => res.render("login"));

// Register Page
router.get("/register", (req, res) => res.render("register"));

// Register Handle
router.post("/register", (req, res) => {
  const { name, password, password2 } = req.body;
  let errors = [];

  //Check required fields
  if (!name || !password || !password) {
    errors.push({ msg: "অনুগ্রহ করে সকল ঘর পূরন করুন" });
  }

  //Check password match
  if (password != password2) {
    errors.push({ msg: "পাসওয়ার্ড মিলছে না!" });
  }

  //Check password length
  if (password.length < 6) {
    errors.push({ msg: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" });
  }

  if (errors.length > 0) {
    res.render("register", {
      errors,
      name,
      password,
      password2
    });
  } else {
    // Validation Passed
    User.findOne({ name: name }).then(user => {
      if (user) {
        //User exists
        errors.push({ msg: "এই নাম আগে থেকেই আছে!" });
        res.render("register", {
          errors,
          name,
          password,
          password2
        });
      } else {
        const newUser = new User({
          name: name,
          password: password
        });

        // Hash Password
        bcrypt.genSalt(10, (err, salt) =>
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;

            // Set password to hashed
            newUser.password = hash;

            // Save user
            newUser
              .save()
              .then(user => {
                req.flash(
                  "success_msg",
                  "রেজিস্টার সম্পন্ন্য হয়েছে আলহামদুলিল্লাহ! এখন লগইন করতে পারে্ন ইনশাল্লাহ"
                );
                res.redirect("/users/login");
              })
              .catch(err => console.log(err));
          })
        );
      }
    });
  }
});

//Login handle
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true
  })(req, res, next);
});

//Logout Handle
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "লগআউট সম্পন্ন্য হয়েছে, ফি আমানিল্লাহ");
  res.redirect("/users/login");
});
module.exports = router;
