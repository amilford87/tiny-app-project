var express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
var cookieParser = require("cookie-parser");
var PORT = 8080;
var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser('random string of text'));


//Random string generator
const randomString = () => {
    return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};



//Our database of users
const users = {
    "userRandomID": {
        id: "userRandomID",
        email: "u@e.b",
        password: "1"
    },
    "user2RandomID": {
        id: "userRandomID",
        email: "user2@example.com",
        password: "dishwasher-funk"
    }
};

//A function for looking up whether the email a user has put in is stored in 'users'
function userEmailLookup (email) {
    for (var allUsers in users) {
        if (users[allUsers].email === email){
         return true;}
        } 
        return false;  
    }

//A function to check the password a user has put in against the password stored in 'users'
function userPasswordLookup (password) {
        for (var allUsers in users) {
            if (bcrypt.compareSync(password, users[allUsers].password)){
             return true;}
            } 
            return false;  
        }

//A function that upon email and password validation, retrieves the user's ID for cookie purposes
function retrieveUser (email, password, users) {
    for (var allUsers in users) {
        if (users[allUsers].email === email && bcrypt.compareSync(password, users[allUsers].password)){
            var useridentification = users[allUsers].id;
            return useridentification;
        }
    } 
    }

app.set("view engine", "ejs");

var urlDatabase = {

    b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
    i3BoGr: { longURL: "https://www.google.ca", userID: "userRandomID" },
    wlfx37s: { longURL: "http://www.yahoo.com", userID: "ozmyq4l" },
    cuqxpss: { longURL: "http://www.lighthouselabs.ca", userID: "ozmyq4l" },
    ctWmTA5: { longURL: "http://www.facebook.com", userID: "xfftpVd" },
    rZZTt4t: { longURL: "https://www.twitter.com", userID: "xfftpVd" }
  };

  //a function to look up a user in the urlDatabase
  function urlsForUser(id) {
    userUrls = { };  
    for (var shortURL in urlDatabase) {
        if (id === urlDatabase[shortURL].userID) {
            userUrls[shortURL] = urlDatabase[shortURL].longURL;
        }
      } return userUrls;
  }



  app.get("/", (req, res) => {
      res.send("Hello!");
  });

  app.get("/urls.json", (req, res) => {
      res.json(urlDatabase);
  });

  app.get("/urls", (req, res) => {
    let user = req.cookies["user_id"];
    let userUrls = urlsForUser(user);
    let templateVars = {
        "user": users[user],   
        urls: userUrls };
      res.render("urls_index", templateVars);
  });
  
  
  app.get("/urls/new", (req, res) => {
    let user = req.cookies["user_id"]
    if (req.cookies["user_id"] === undefined){
        res.redirect("/login");
    }
    let templateVars = { 
        "user": users[user] };
      res.render("urls_new", templateVars);
    });

    
    app.get("/urls/:shortURL", (req, res) => {
        let user = req.cookies["user_id"];
        let userUrls = urlsForUser(user);
        if (user === urlDatabase[req.params.shortURL].userID){
            
        let templateVars = { 
            "user": users[user],
            shortURL: req.params.shortURL, 
            longURL: urlDatabase[req.params.shortURL] };
        res.render("urls_show", templateVars);
        }
        res.redirect("/login");
    });

    app.post("/urls/:shortURL/update", (req, res) => {
        let user = req.cookies["user_id"];
        if (user === urlDatabase[req.params.shortURL].userID) { 
        urlDatabase[req.params.shortURL] = { "longURL": req.body.longURLUpdate, "userID": user };
        res.redirect("/urls");
        }
        else {
            res.redirect("/login");
        }
    });
    
    app.post("/urls", (req, res) => {
        var urlRandomString = randomString();
        if (req.body.longURL.slice(0,4) !== "http") {
            var newLongUrl = "http://"+req.body.longURL;
            urlDatabase[urlRandomString] = { longURL: newLongUrl, userID: req.cookies["user_id"] };
            res.redirect("/urls/" + urlRandomString, 302);
        } else {
        
        urlDatabase[urlRandomString] = { longURL: req.body.longURL, userID: req.cookies["user_id"] };
        res.redirect("/urls/" + urlRandomString, 302);
        }
    });

    app.post("/urls/:shortURL/delete/", (req, res) => {
        let user = req.cookies["user_id"];
        if (user === urlDatabase[req.params.shortURL].userID){
        delete urlDatabase[req.params.shortURL];
        res.redirect("/urls/");
        }
        res.redirect("/login");
    });

    app.get("/urls/:shortURL/delete/", (req, res) => {
        let user = req.cookies["user_id"];
        if (user === urlDatabase[req.params.shortURL].userID){
        delete urlDatabase[req.params.shortURL];
        res.redirect("/urls/");
        }
        res.redirect("/login");
    })
    
    app.get("/u/:shortURL", (req, res) => {
        let longURL = urlDatabase[req.params.shortURL].longURL;
        res.redirect(longURL);
      });

      app.get("/register", (req, res) => {
        let user = req.cookies["user_id"];
        let usersURL = urlsForUser(user);
        let templateVars = { 
            "user": users[user],
            shortURL: req.params.shortURL, 
            longURL: usersURL[req.params.shortURL] };
        res.render("register", templateVars);
    });

    app.post("/register", (req, res) => {
        let randomID = randomString();
        if (!req.body.email || !req.body.password) {
            res.status(400).end('no input');
        } else if (req.body.email) {
            if (userEmailLookup(req.body.email)){
                res.status(400).end('already registered');
            }
            
        users[randomID] = {
            id: randomID,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10)
        }; 
    }
        res.cookie("user_id", randomID);
        res.redirect("/urls/");
    });

    app.get("/login", (req, res) => {
        let user = req.cookies["user_id"];
        let usersURL = urlsForUser(user);
        let templateVars = { 
            "user": users[user],
            shortURL: req.params.shortURL, 
            longURL: usersURL[req.params.shortURL] };
        res.render("login", templateVars);
    });

      app.post("/login", (req, res) => {
        if (userEmailLookup(req.body.email)){
            if (!userPasswordLookup(req.body.password)) {
                res.status(403).end('incorrect password');
            } else{

            res.cookie("user_id", retrieveUser(req.body.email, req.body.password, users));    
            res.redirect("/urls/");
            }
        } else {
            res.status(403).end('email not registered');
        }

      });

      app.post("/logout", (req, res) => {
        res.clearCookie("user_id", req.body.user);
        res.redirect("/urls/");
      });

  app.get("/hello", (req, res) => {
      res.send("<html><body>Hello <b>World</b></body></html>");
  });

//which PORT we are listening on
  app.listen(PORT, () => {
      console.log(`Example app listening on port ${PORT}!`);
  });
