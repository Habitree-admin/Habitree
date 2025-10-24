const csrf = require('csurf');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { decryptUserData } = require('../util/encryption'); // Ensure correct path

/**
 * This function renders the login page with CSRF protection.
 * 
 * getLogin Displays the login view and shows any error message if it happened.
 */
exports.getLogin = (req, res) => {
  const failed = req.session.failed || false;
  res.render('../views/login', {
    csrfToken: req.csrfToken(),
    failed,
  });
};


/**
 * This function handles the user login.
 * 
 * postLogin basically performs the POST petition
 * and validates the user credentials, and starts the session
 */
exports.postLogin = async (req, res) => {
  try {
    // Search user by email
    const [rows] = await User.fetchOne(req.body.email);

    if (rows.length === 0) {
      req.session.failed = 'Incorrect email or password';
      return res.redirect('/login');
    }

    const user = rows[0]; // User data is already decrypted by fetchOne

    // Verify password
    const doMatch = await bcrypt.compare(req.body.password, user.password);
    if (!doMatch) {
      req.session.failed = 'Incorrect email or password';
      return res.redirect('/login');
    }

    // Verify admin role
    const [[roleRow]] = await User.getRolByUserId(user.IDUser);

    if (!roleRow || roleRow.rol.toLowerCase() !== 'admin') {
      req.session.failed = 'You do not have permission to log in';
      return res.redirect('/login');
    }

    // Save decrypted data in session
    req.session.idUsuario = user.IDUser;
    req.session.name = user.name;
    req.session.email = user.email;
    req.session.gender = user.gender;
    req.session.dateOfBirth = user.dateOfBirth;
    req.session.isLoggedIn = true;

    // Save session and redirect
    req.session.save(err => {
      if (err) {
        req.session.failed = 'Session error';
        return res.redirect('/login');
      }
      res.redirect('/');
    });
  } catch (error) {
    req.session.failed = 'Database error';
    res.redirect('/login');
  }
};