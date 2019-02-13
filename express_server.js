var express = require("express");
var app = express();
var PORT = 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

function generateRandomString() {
    return Math.random().toString(36).substr(2, 7);
}
let tinyUrl = generateRandomString();

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
      let templateVars = { urls: urlDatabase };
      res.render("urls_index", templateVars);
  });
  
  
  app.get("/urls/new", (req, res) => {
      res.render("urls_new");
    });

    
    app.get("/urls/:shortURL", (req, res) => {
        let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
        res.render("urls_show", templateVars);
    });
    
    app.post("/urls", (req, res) => {
        if (req.body.longURL.slice(0,4) !== "http") {
            var newLongUrl = "http://"+req.body.longURL;
            urlDatabase[tinyUrl] = newLongUrl;
            res.redirect("/urls/" + tinyUrl, 302);
        } else {
        
        urlDatabase[tinyUrl] = req.body.longURL;
        res.redirect("/urls/" + tinyUrl, 302);
        }
    });
    
    app.get("/u/:shortURL", (req, res) => {
        const longURL = urlDatabase[req.params.shortURL];
        res.redirect(longURL);
      });

  app.get("/hello", (req, res) => {
      res.send("<html><body>Hello <b>World</b></body></html>");
  });


  app.listen(PORT, () => {
      console.log(`Example app listening on port ${PORT}!`);
  });
