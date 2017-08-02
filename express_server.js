var express = require('express');
var randomstring = require('randomstring');
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

app.set('view engine', 'ejs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  'b2xVn2': "http://www.lighthouselabs.ca",
  '9sm5xK': "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end('Hello!');
});

app.get('/urls', (req, res) => {
    let data = { urls: urlDatabase };
    res.render('urls_index', data);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let data = { shortURL: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", data);
});

app.post("/urls", (req, res) => {   
  let key = generateRandomString();
  urlDatabase[key] = req.body.longURL;
  res.redirect(`/urls/${key}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/urls.json', (req, res) => { 
  res.json(urlDatabase); 
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
    return randomstring.generate(6);
}