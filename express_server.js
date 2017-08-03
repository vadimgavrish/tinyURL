const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const randomString = require('randomstring');
const PORT = process.env.PORT || 8080; 

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  'b2xVn2': "http://www.lighthouselabs.ca",
  '9sm5xK': "http://www.google.com"
};

const users = {
  'userOneID': {
    id: 'userOneID',
    email: 'userone@example.com',
    password: 'demopassword'
  },
  'userTwoID': {
    id: 'userTwoID',
    email: 'usertwo@example.com',
    passowrd: 'testpassword'
  }
};

app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  let data = { 
    urls: urlDatabase,
    user: users[req.cookies['user_ID']],
    
  };
  console.log(data);
  res.render('urls_index', data);
});

app.get("/urls/new", (req, res) => {
  let data = {
    user: users[req.cookies['user_ID']]
  };
  res.render("urls_new", data);
});

app.get('/register', (req, res) => {
  res.render('urls_register');
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

// new user registration
app.post('/register', (req, res) => {

  // check if email already in use
    for (key in users) {
      if (users[key].email == req.body.email) {
          res.status(400).send('Email already in use!');
          return;
      };
    };

  // check for valid inputs
  if (!req.body.email) {
      res.status(400).send('Please enter a email address!');
      return;
  } else if (!req.body.password) {
      res.status(400).send('Please enter a password!');
      return;
  };

  // create new user 
  let userID = generateRandomString();
  users[userID] = {};
  users[userID].id = userID;
  users[userID].email = req.body.email;
  users[userID].password = req.body.password;
  
  res.cookie('user_ID', users[userID].id);
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');  
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_ID');
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