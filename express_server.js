const express = require('express');
const app = express();
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const randomString = require('randomstring');
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 8080; 

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["encryptme"]
}));

const urlDatabase = {
  'b2xVn2': {
    longURL: "http://www.lighthouselabs.ca", 
    userID: 'userOneID'
  },
  '9sm5xK': {
    longURL: "http://www.google.com",
    userID: 'userTwoID'
  }
};

const users = {
  'userOneID': {
    id: 'userOneID',
    name: 'Nick',
    email: 'userone@example.com',
    password: 'demopassword'
  },
  'userTwoID': {
    id: 'userTwoID',
    name: 'Michelle',
    email: 'usertwo@example.com',
    password: 'test'
  }
};

app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  if (!users[req.session.user_ID]) {
    req.session = null;
    res.redirect('/login');
    return;
  }

  if (!req.session.user_ID) {
    res.redirect('/login');
    return;
  }

  let userDB = {};

  for (key in urlDatabase) {
    if (urlDatabase[key].userID === req.session.user_ID) {
      userDB[key] = urlDatabase[key].longURL;
    }
  }

  let data = { 
    urls: userDB,
    name: users[req.session.user_ID].name,
    email: users[req.session.user_ID].email,
    user: req.session.user_ID
  };
  res.render('urls_index', data);
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_ID) {
    let data = {
      name: users[req.session.user_ID].name,
      email: users[req.session.user_ID].email,
      user: req.session.user_ID
    }

    res.render("urls_new", data);
    return;
  } else {
    res.redirect('/login');
  }
});

app.get('/register', (req, res) => {
  if(req.session.user_ID) {
    console.log('please log out first');
    res.redirect('/urls');
    return;
  }
  res.render('urls_register');
});

app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    console.log('empty link');
    res.redirect('/urls');
  return;
  }

  if (urlDatabase[req.params.id].userID != req.session.user_ID) {
    console.log('wrong user');
    res.redirect('/urls');
    return;
  }
  
  let data = { 
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  res.render("urls_show", data);
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.updatedURL;
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {   
  let key = randomString.generate(6);
  urlDatabase[key] = {};
  urlDatabase[key].userID = req.session.user_ID;
  urlDatabase[key].longURL = req.body.longURL;
  res.redirect(`/urls/${key}`);
});

app.post('/register', (req, res) => {
  for (key in users) {
    if (users[key].email == req.body.email) {
      res.status(400).send('Email already in use!');
      return;
    };
  }

  if (!req.body.email) {
    res.status(400).send('Please enter a email address!');
    return;
  } else if (!req.body.password) {
    res.status(400).send('Please enter a password!');
    return;
  }

  let userID = randomString.generate(6);
  users[userID] = {};
  users[userID].id = userID;
  users[userID].name = req.body.name;
  users[userID].email = req.body.email;
  
  let password = req.body.password;
  users[userID].password = bcrypt.hashSync(password, 10);
  
  req.session.user_ID = userID;
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  if(req.session.user_ID) {
    console.log('already logged in');
    res.redirect('/urls');
    return;
  }
  let user = req.session.user_ID;
  res.render("urls_login", user);
});

app.post('/login', (req, res) => {
  for (var key in users) {
    if (users[key].email === req.body.email) {
      if (bcrypt.compareSync(req.body.password, users[key].password)) {
        req.session.user_ID = users[key].id;
        res.redirect('/urls');
        return;     
      } else {
        res.status(400).send('invalid password!');
        return;
      }
    }
  }
  res.status(400).send('invalid login!');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    console.log('not a valid page');
    res.redirect('/urls');
    return;
  }

  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get('/urls.json', (req, res) => { 
  res.json(urlDatabase);
});

app.post('/urls/:id', (req, res) => {
  if(!req.session.user_ID) {
    res.status(400).send('Not logged in as correct user to perform this action!');
    return;
  }
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`TinyURL app is listening on port ${PORT}!`);
});