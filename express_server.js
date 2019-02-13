var express = require("express");
var app = express();
var PORT = 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
var cookieParser = require("cookie-parser");
app.use(cookieParser());

function generateRandomString() {
    return Math.random().toString(36).substr(2, 7);
}
//Random string generator adapted from https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript

let randomString = generateRandomString();

const users = {
    "userRandomID": {
        id: "userRandomID",
        email: "user@example.com",
        password: "purple-monkey-dinosaur"
    },
    "user2RandomID": {
        id: "userRandomID",
        email: "user2@example.com",
        password: "dishwasher-funk"
    }
};

app.set("view engine", "ejs");

var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
  };

  app.get("/", (req, res) => {
      res.send("Hello!");
  });

  app.get("/urls.json", (req, res) => {
      res.json(urlDatabase);
  });

  app.get("/urls", (req, res) => {
      let templateVars = { 
        username: req.cookies["username"],  
        urls: urlDatabase };
      res.render("urls_index", templateVars);
  });
  
  
  app.get("/urls/new", (req, res) => {
    let templateVars = { 
        username: req.cookies["username"] };
      res.render("urls_new", templateVars);
    });

    
    app.get("/urls/:shortURL", (req, res) => {
        let templateVars = { 
            username: req.cookies["username"],
            shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
        res.render("urls_show", templateVars);
    });

    app.post("/urls/:shortURL", (req, res) => {
       urlDatabase[req.params.shortURL] = req.body.longURLUpdate;
        res.redirect("/urls/");
    });
    
    app.post("/urls", (req, res) => {
        if (req.body.longURL.slice(0,4) !== "http") {
            var newLongUrl = "http://"+req.body.longURL;
            urlDatabase[randomString] = newLongUrl;
            res.redirect("/urls/" + randomString, 302);
        } else {
        
        urlDatabase[randomString] = req.body.longURL;
        res.redirect("/urls/" + randomString, 302);
        }
    });

    app.post("/urls/:shortURL/delete/", (req, res) => {
        delete urlDatabase[req.params.shortURL];
        res.redirect("/urls/");
    });
    
    app.get("/u/:shortURL", (req, res) => {
        let longURL = urlDatabase[req.params.shortURL];
        res.redirect(longURL);
      });

      app.get("/register", (req, res) => {
        let templateVars = { 
            username: req.cookies["username"],
            shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
        res.render("register", templateVars);
    });

    app.post("/register", (req, res) => {
        if (!req.body.email || !req.body.password) {
            res.status(400).end('no input');
        } else if (req.body.email) {
            for (var allUsers in users) {
                if (users[allUsers].email === req.body.email){
                res.status(400).end('already registered');
            }
            }
        }
        let randomID = generateRandomString();
        users[randomID] = {
            id: randomID,
            email: req.body.email,
            password: req.body.password
        }; 
        res.cookie('user_id', randomID);
        res.redirect("/urls/");
    });

      app.post("/login", (req, res) => {
        res.cookie('username', req.body.username);
        res.redirect("/urls/");
      });

      app.post("/logout", (req, res) => {
        res.clearCookie('username', req.body.username);
        res.redirect("/urls/");
      });

  app.get("/hello", (req, res) => {
      res.send("<html><body>Hello <b>World</b></body></html>");
  });


  app.listen(PORT, () => {
      console.log(`Example app listening on port ${PORT}!`);
  });
