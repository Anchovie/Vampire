
/*var express = require("express"); //
var app = express(); //
var http = require("http").Server(app);
var io = require("socket.io")(http);
*/
/*
var express = require("express"); //
var socket = require("socket.io");
var app = express(); //

var server = app.listen(3000, "0.0.0.0");
var io = socket(server);
//app.use(express.static('public'));
*/
/*
var express = require('express'), //
    http = require('http');
var app = express(); //
var server = http.createServer(app);
var io = require("socket.io")(http);
//var io = require('socket.io').listen(server);
*/
//server.listen(3000, "0.0.0.0");
const express = require("express");
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3001;
const JSONdb = require('simple-json-db');
const db = new JSONdb('db\\database.json');


io.on('connection', socket => {
  console.log('A new user has joined the chat');
  console.log("ID = " + socket.id);

  socket.emit('message', 'You have successfully joined the chat');

  socket.on('message', (msg) => {
    io.emit('message', msg);
    if (db.has("messages")) {
      console.log("DB HAS messages, concatting");
      console.log(db.get("messages"));
      let msgs = db.get("messages");
      msgs += "\n" + socket.id + ":" + msg;
      //db.set("messages", msgs);
    } else {
      console.log("DB DOES NOT HAVE MESSAGES");
      //db.set("messages", "\n" + socket.id + ":" + msg);
      //console.log()
    }
  });

  socket.on("newUser", (user) => {
    socket.broadcast.emit("message", "New user ("+ user +") joined! Say hey");
  });

  socket.on("save", (character) => {
    console.log(character);
    var charStr = JSON.stringify(character);
    console.log(charStr);
    if (db.has(character["player"])) {
      console.log("DB HAS PLAYER " + character["player"]);
      console.log(db.get(character["player"]));
    } else {
      console.log("DB DOES NOT HAVE ENTRY FOR " + character["player"]);
      db.set(character["player"], charStr );
      console.log()
    }
    io.emit("message", "Received character sheet");
  });

  socket.on("load", (player) => {
    if (db.has(player)) {
      console.log("DB HAS PLAYER " + player);
      console.log(db.get(player));
      socket.emit("characterStats", JSON.parse(db.get(player)));
    } else {
      console.log("DB DOES NOT HAVE ENTRY FOR " + player);
    }
  });

});

var server = http.listen(process.env.PORT || 3001, () => {
  console.log(server.address());
 console.log("server is running on port", server.address().port);
});

app.use(express.static(__dirname));
