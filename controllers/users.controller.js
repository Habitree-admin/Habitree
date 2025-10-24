const csrf = require("csurf");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Usuario = require("../models/user.model");
const nodemailer = require("nodemailer")

/**
*  
* This variable sets up the transporter to send an email
* via the nodemailer api
* 
*/
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // email thats going to send the email
        pass: process.env.EMAIL_PASS  // email password requiered to send the email
    }
});

/**
*  
* This function generates a random password to
* send to the user thats going to get registered
* 
*/
function generateRandomPassword(length = 12) {
    return crypto.randomBytes(length).toString("base64url").slice(0, length);      
}

/**
 * Gets users list
 * 
 * pass users list to the users view, if users not found, shows error.
 * 
 */
exports.getUsers = async (req, res) => {
    try {
        const usuarios = await Usuario.fetchAll();
        res.render('../views/users', {
            title: 'Users',
            usuarios,
            csrfToken: req.csrfToken()
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error getting users");
    }
};

// get user by ID
exports.getUserById = async (req, res) => {
    try {
        const [rows] = await Usuario.fetchById(req.params.id);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching user' });
    }
};

/**
 
 this function updates a user in the application
 this function validates email and check changes to the db
*
 */
exports.editUser = async (req, res) => {
    try {
        // Read user ID and updated fields from the request
        const id = req.params.id;
        const data = {
            name: req.body.name,
            email: req.body.email,
            gender: req.body.gender,
            dateOfBirth: req.body.dateOfBirth
        };
        // Check if provided email already exists for another user
        const [existingEmailRows] = await Usuario.checkEmailExists(data.email, id);
        if (existingEmailRows.length > 0) {
            return res.status(400).json({ success: false, message: 'El correo ya existe, elige otro.' });
        }
        const result = await Usuario.update(id, data);

        if (result[0].affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Return success response
        res.json({ success: true, message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating user' });
    }
};

/**
 * 
 * This function handles the POST method of the user route
 * and sends an email to the user being registered with its
 * credentials
 */
exports.postUsers = async (req, res) => {
    console.log("Datos recibidos en POST /users:", req.body);

    try {
        const email = String(req.body.email || '').trim().toLowerCase();

        const [rows] = await Usuario.fetchOne(email);
        const existsAndActive = rows && rows.length > 0 && rows[0].deleted === 0;
        if (existsAndActive) {
            const usuarios = await Usuario.fetchAll();
            return res.status(400).render('../views/users', {
                title: 'Users',
                usuarios,
                csrfToken: req.csrfToken(),
                alertMessage: 'This email is already registered. Please use a different one.'
            });
        }

        // Generates random password
        const passwordPlano = generateRandomPassword(12);
        // Hashes the plain password
        const hashedPassword = await bcrypt.hash(passwordPlano, 12);

        // Saves the user
        await Usuario.save({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            gender: req.body.gender,
            dateOfBirth: req.body.dateOfBirth,
        });


        // variables to send the email
        const userEmail = req.body.email;
        const userPassword = passwordPlano;

        // Sets up the emaill message
        const mailOptions = {
            from: `"Habitree App" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: "Login Credentials",
            html: `
                <h2>Registration Succesful!</h2>
                <p>Here are your login credentials:</p>
                <ul>
                    <li><strong>Email:</strong> ${userEmail}</li>
                    <li><strong>Password:</strong> ${userPassword}</li>
                </ul>
                <p>Please store this information securely and do not share it with anyone.</p>
            `,
        };

        // sends email
        await transporter.sendMail(mailOptions);
        console.log("Correo enviado a:", userEmail);

        res.redirect('/users');
    } catch (err) {

        //error handling
        console.error(err);
        if (err.code === 'DUPLICATE_EMAIL' || err.code === 'ER_DUP_ENTRY') {
            try {
                const usuarios = await Usuario.fetchAll();
                return res.status(400).render('../views/users', {
                    title: 'Users',
                    usuarios,
                    csrfToken: req.csrfToken(),
                    alertMessage: 'This email is already registered. Please use a different one.'
                });
            } catch (inner) {
                console.error(inner);
            }
        }
        res.status(500).send("Error creating user");
    }
};

/**
 
 this function soft-deletes a user
 this function marks the user deleted and desactivate sessions
*
 */
exports.deleteUser = async (req, res) => {
    try {
        // Read user ID and perform logical delete
        const id = req.params.id;
        const [result] = await Usuario.softDelete(id);
        const affected = result && result.affectedRows ? result.affectedRows : 0;
        console.log(`deleteUser called for id=${id}, affectedRows=${affected}`);
        if (affected === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Invalidate any active sessions for this user
        try {
            const sessionStore = req.sessionStore;
            if (sessionStore && typeof sessionStore.all === 'function') {
                sessionStore.all((err, sessions) => {
                    if (err) {
                        console.error('Error listing sessions:', err);
                    } else if (sessions) {
                        const iterate = (entries) => {
                            for (const sid in entries) {
                                if (!Object.prototype.hasOwnProperty.call(entries, sid)) continue;
                                let sess = entries[sid];
                                try {
                                    if (typeof sess === 'string') sess = JSON.parse(sess);
                                } catch (parseErr) {
                                }
                                // If session belongs to deleted user, destroy it
                                if (sess && String(sess.idUsuario) === String(id)) {
                                    sessionStore.destroy(sid, (destroyErr) => {
                                        if (destroyErr) console.error('Error destroying session', sid, destroyErr);
                                    });
                                }
                            }
                        };

                        if (Array.isArray(sessions)) {
                            // convert array to map-like object
                            sessions.forEach((sessObj, index) => {
                                const sid = sessObj && sessObj.id ? sessObj.id : String(index);
                                iterate({ [sid]: sessObj });
                            });
                        } else {
                            iterate(sessions);
                        }
                    }
                });
            }
        } catch (sessionErr) {
            console.error('Session invalidation error:', sessionErr);
        }

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error deleting user' });
    }
};

/**
 
 this function logs out the current user
 this destroys the session, clears the cookie, and redirects to login
*
 */
exports.logout = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session during logout:', err);
                return res.status(500).send('Error logging out');
            }
            // Clear the cookie and redirect
            res.clearCookie('connect.sid');
            res.redirect('/login');
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).send('Error logging out');
    }
};
