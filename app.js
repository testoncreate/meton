const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const fs = require("fs");

// Socket IO Config
const app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

// Mongo models
const Message = require("./models/Message");

// Passport config
require("./config/passport")(passport);

// DB Config
const db = require("./config/keys").MongoURI;

// Connect to Mongo
mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => console.log("MongoDB Connceted"))
  .catch(err => console.log(err));
/*
mongoose
  .connect("mongodb://localhost:27017/myapp", { useNewUrlParser: true })
  .then(() => console.log("MongoDB Connceted"))
  .catch(err => console.log(err));*/

// EJS
app.use(expressLayouts);
app.set("view engine", "ejs");

// Bodyparser
app.use(express.urlencoded({ extended: false }));

// Express session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global Vars
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// Routes
app.use("/", require("./routes/index"));
app.use("/users/", require("./routes/users"));

const PORT = process.env.PORT || 5000;

server.listen(PORT, console.log(`Server started on port ${PORT}`));

users = [];

// Connection
io.sockets.on("connection", function(socket) {
  updateUsernames(); // To update users list on startup
  // Get chats from mongo
  Message.find()
    .sort({ _id: -1 })
    .limit(50)
    .exec(function(err, output) {
      if (err) {
        throw err;
      }
      // console.log(output);

      // Emit the messages
      socket.emit("output", output);
    });

  // Download chat
  socket.on("dwn", function() {
    // console.log('ok');
    Message.find().exec(function(err, output) {
      if (err) {
        throw err;
      }
      var allmsg = [];
      var l = output.length;
      for (i = 0; i < l; i++) {
        allmsg[i] = output[i].name + ": " + output[i].message;
      }
      // console.log(output.length);
      // write to a new file named 2pac.txt
      fs.writeFile("./routes/chatlog.txt", allmsg, err => {
        // throws an error, you could also catch it here
        if (err) throw err;

        // success case, the file was saved
        // console.log('saved!');
      });
    });
  });

  // Delete all chats
  socket.on("dlt", function() {
    Message.collection.drop();

    const path = "./routes/chatlog.txt";

    fs.unlink(path, err => {
      if (err) {
        // console.error(err)
        return;
      }
    });
  });

  // Load more chats
  socket.on("loadmore", function(data) {
    Message.find().exec(function(err, output) {
      if (err) {
        throw err;
      }
      output.reverse();
      for (i = 0; i < data; i++) {
        output.shift();
      }

      // Send load more messages
      socket.emit("lm-meesages", output.slice(0, 15));
    });
  });

  // New user
  socket.on("username", function(data, callback) {
    ut = { username: data.user, time: data.time };
    nope = true;

    for (var x = 0; x < users.length; x++) {
      if (users[x].username === data.user) {
        nope = false;
      }
    }

    if (nope) {
      users.push(ut);
    }

    // New user emitting
    io.sockets.emit("nUser", data);
  });

  // Refresh users after 15mints 
  let fxn = function () {
	var date = new Date();
        var min = date.getMinutes();
       // var sec = date.getSeconds();
        if (min == "15" || min == "30" || min == "45" || min == "0") {
	  users = []; 
          socket.emit('refresh');
        }
    }; setInterval(fxn, 30000);

  // Logout
  socket.on("lg", function(data) {
    // console.log('called');
    for (var i = 0; i < users.length; i++) {
      if (users[i].username == data) {
        users.splice(i, 1);
        break;
      }
    }

    io.sockets.emit("lgUser", data);
  });

  // Send Message
  socket.on("send message", function(data) {
    io.sockets.emit("new message", {
      user: data.user,
      msg: data.msg,
      time: data.time
    });

    const newMessage = new Message({
      name: data.user,
      message: data.msg,
      time: data.time
    });

    // Save user
    newMessage
      .save()
      .then(message => {
        // console.log('saved');
      })
      .catch(err => console.log(err));
  });

  function updateUsernames() {
    // Emit users list
    socket.emit("get users", users);
  }
});
