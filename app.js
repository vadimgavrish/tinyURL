// Set up default app parameters
const express = require('express');
const app = express();
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const randomString = require('randomstring');
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 8080; 

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["encryptme"]
}));

// Set up local URL and user databases
const urlDatabase = {};
const users = {};

app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  // Check if currently logged in user exists in database
  if (!users[req.session.user_ID]) {
    req.session = null;
    res.redirect('/login');
    return;
  }

  // If user not logged in, redirect to login page
  if (!req.session.user_ID) {
    res.redirect('/login');
    return;
  }

  // Send links that belong to logged in user to main page
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

app.post("/urls", (req, res) => {   
  // Check for valid URL input
  let longURL = req.body.longURL;
  if (longURL === "") {
    res.status(400).send('Please enter a valid URL!');
    return;
  }
  if ((longURL.substring(0,7) !== "http://") && (longURL.substring(0,8) !== "https://")) {
      longURL = `https://${longURL}`;
  }
  
  // Generate and store short URL
  let key = randomString.generate(6);
  urlDatabase[key] = {};
  urlDatabase[key].userID = req.session.user_ID;
  urlDatabase[key].longURL = longURL;
  res.redirect(`/urls/${key}`);
});

app.get('/login', (req, res) => {
  // If user is already logged in, send to home page
  if(req.session.user_ID) {
    res.redirect('/urls');
    return;
  }
  // Identify user and send to login page
  let user = req.session.user_ID;
  res.render("urls_login", user);
});

app.post('/login', (req, res) => {
  // Check if entered information matches a user in database
  for (key in users) {
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

app.get('/register', (req, res) => {
  // If user is already logged in, redirect to home page
  if(req.session.user_ID) {
    res.redirect('/urls');
    return;
  }
  res.render('urls_register');
});

app.post('/register', (req, res) => {
  // Check if email is already in use
  for (key in users) {
    if (users[key].email == req.body.email) {
      res.status(400).send('Email already in use!');
      return;
    };
  }

  // Check if both email and password have been entered
  if (!req.body.email) {
    res.status(400).send('Please enter a email address!');
    return;
  } else if (!req.body.password) {
    res.status(400).send('Please enter a password!');
    return;
  }

  // Create new user and store in database
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

// Logout user when they click logout button
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get("/urls/new", (req, res) => {
  // Allow creation of new URL if user is logged in
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

app.get("/urls/:id", (req, res) => {
  // Redirect to home if invalid link
  if (!urlDatabase[req.params.id]) {
    res.redirect('/urls');
  return;
  }

  // Prevent users from accessing each others 'update link' pages
  if (urlDatabase[req.params.id].userID != req.session.user_ID) {
    res.redirect('/urls');
    return;
  }
  
  // Get correct short and long url
  let data = { 
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    name: users[req.session.user_ID].name,
    email: users[req.session.user_ID].email,
    user: req.session.user_ID
  };
  res.render("urls_show", data);
});

app.post('/urls/:id', (req, res) => {
  // Check if user is logged in
  if(!req.session.user_ID) {
    res.status(400).send('Must be logged in to perform this action!');
    return;
  }
  // Prevent users from deleting each others links
  if (users[req.session.user_ID].id != req.session.user_ID) {
    req.session = null;
    res.redirect('/login');
    return;
  }
  // Delete selected URL
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post("/urls/:id/update", (req, res) => {
  // Check for corrent URL input
  let longURL = req.body.updatedURL;
  if (longURL === "") {
    res.status(400).send('Please enter a valid URL!');
    return;
  }
  if ((longURL.substring(0,7) !== "http://") && (longURL.substring(0,8) !== "https://")) {
      longURL = `https://${longURL}`;
  }
  // Overwrite old longURL with the new one
  urlDatabase[req.params.id].longURL = longURL;
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  // Send error if invalid URL entered
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send('Page not found!');
    return;
  }
  // Get correct longURL from database and redirect to it
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get('/urls.json', (req, res) => { 
  res.json(urlDatabase);
});

// Notify user of application status
app.listen(PORT, () => {
  console.log(`TinyURL app is running port ${PORT}! Press Ctrl-C to terminate.`);
});