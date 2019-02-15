//Requirements
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require("cookie-session");


const PORT = 8080;
const app = express();
app.set("view engine", "ejs");

//Implementing Body Parser and Cookie Session
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
    name: 'session',
    keys: ["keystring1234"]
}));


//Random string generator
const randomString = () => {
    return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};



//Our database of users
const users = {  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

//A global function for looking up whether the email a user has put in is stored in 'users'
function userEmailLookup (email) {
    for (var allUsers in users) {
        if (users[allUsers].email === email){
            return true;}
        }
        return false;
}

//A global function to check the password a user has put in against the password stored in 'users'
function userPasswordLookup (password) {
    for (var allUsers in users) {
        if (bcrypt.compareSync(password, users[allUsers].password)){
            return true;}
        }
        return false;
}

//A global function that upon email and password validation, retrieves the user's ID for cookie purposes
function retrieveUser (email, password, users) {
    for (var allUsers in users) {
        if (users[allUsers].email === email && bcrypt.compareSync(password, users[allUsers].password)){
            var useridentification = users[allUsers].id;
            return useridentification;
        }
    }
}

//The database for our URLS
var urlDatabase = { 
    b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
    i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

//a function to look up a user in the urlDatabase
function urlsForUser(id) {
    let userUrls = { };  
    for (var shortURL in urlDatabase) {
        if (id === urlDatabase[shortURL].userID) {
            userUrls[shortURL] = urlDatabase[shortURL].longURL;
        }
    } return userUrls;
}
  
//For our "/" page
app.get("/", (req, res) => {
    if (req.session.user_id === undefined){
        res.redirect("/login");
    }
    res.redirect("/urls");
});
    
//for our Login page
app.get("/login", (req, res) => {
    let user = req.session.user_id;
    let usersURL = urlsForUser(user);
    if (user !== undefined){
        res.redirect("/urls");
    } else {
        let templateVars = { 
            "user": users[user],
            shortURL: req.params.shortURL, 
            longURL: usersURL[req.params.shortURL] };
            res.render("login", templateVars);
        }
});

    
app.post("/login", (req, res) => {
    if (userEmailLookup(req.body.email)){
        if (!userPasswordLookup(req.body.password)) {
            res.status(403).end('incorrect password');
        } else {
            req.session.user_id = retrieveUser(req.body.email, req.body.password, users);
            res.redirect("/urls/");
        } 
    } else {
        res.status(403).end('email not registered');
    }
});


    
//For our Logout action
app.post("/logout", (req, res) => {
    delete req.session.user_id;
    res.redirect("/urls/");
});

//For our Register page
app.get("/register", (req, res) => {
    let user = req.session.user_id;
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
    req.session.user_id = randomID;
    res.redirect("/urls/");
});

//For the Urls Page
app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});
    
app.get("/urls", (req, res) => {
    let user = req.session.user_id;
    if (req.session.user_id === undefined){
        res.status(400).end('please login');
    }
    let userUrls = urlsForUser(user);
    let templateVars = {
        "user": users[user],
        urls: userUrls };
        res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
    var urlRandomString = randomString();
    if (req.body.longURL.slice(0,4) !== "http") {
        var newLongUrl = "http://"+req.body.longURL;
        urlDatabase[urlRandomString] = { longURL: newLongUrl, userID: req.session.user_id };
        res.redirect("/urls/" + urlRandomString);
    } else {
        urlDatabase[urlRandomString] = { longURL: req.body.longURL, userID: req.session.user_id };
        res.redirect("/urls/" + urlRandomString);
    }
});
  
//For a new URL  
app.get("/urls/new", (req, res) => {
    let user = req.session.user_id;
    if (req.session.user_id === undefined){
        res.redirect("/login");
    }
    let templateVars = { 
        "user": users[user] };
        res.render("urls_new", templateVars);
});

//For the short URL page
app.get("/urls/:shortURL", (req, res) => {
    let user = req.session.user_id;
    if (user === urlDatabase[req.params.shortURL].userID){
        let templateVars = { 
            "user": users[user],
            shortURL: req.params.shortURL, 
            longURL: urlDatabase[req.params.shortURL].longURL
        };
        res.render("urls_show", templateVars);
        return;
    }
    res.redirect("/login");
});

//to update a short URL
app.post("/urls/:shortURL/update", (req, res) => {
    let user = req.session.user_id;
    if (user === urlDatabase[req.params.shortURL].userID) { 
        urlDatabase[req.params.shortURL] = { "longURL": req.body.longURLUpdate, "userID": user };
        res.redirect("/urls");
    }
    else {
        res.redirect("/login");
    }
});
    
//to delete a URL
app.get("/urls/:shortURL/delete/", (req, res) => {
    let user = req.session.user_id;
    if (user === urlDatabase[req.params.shortURL].userID){
        delete urlDatabase[req.params.shortURL];
        res.redirect("/urls/");
    }
    res.redirect("/login");
});

app.post("/urls/:shortURL/delete/", (req, res) => {
    let user = req.session.user_id;
    if (user === urlDatabase[req.params.shortURL].userID){
        delete urlDatabase[req.params.shortURL];
        res.redirect("/urls/");
    }
    res.redirect("/login");
});


//For the short Url link
app.get("/u/:shortURL", (req, res) => {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
});

//which PORT we are listening on
  app.listen(PORT, () => {
      console.log(`Example app listening on port ${PORT}!`);
  });
