const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const randomString = require('randomstring');
const PORT = process.env.PORT || 8080; 

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

var urlDatabase = {
  'b2xVn2': "http://www.lighthouselabs.ca",
  '9sm5xK': "http://www.google.com"
};

app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  let data = { 
    urls: urlDatabase,
    username: req.cookies['username'] 
  };
  res.render('urls_index', data);
});

app.get("/urls/new", (req, res) => {
  let data = {
    username: req.cookies['username']
  };
  res.render("urls_new", data);
});

app.get("/urls/:id", (req, res) => {
  let data = { 
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", data);
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.updatedURL;
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {   
  let key = generateRandomString();
  urlDatabase[key] = req.body.longURL;
  res.redirect(`/urls/${key}`);
});

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/urls.json', (req, res) => { 
  res.json(urlDatabase); 
});

app.post('/urls/:id', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`TinyURL app is listening on port ${PORT}!`);
});


function generateRandomString() {
    return randomString.generate(6);
}