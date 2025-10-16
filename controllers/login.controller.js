const csrf = require("csurf");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

exports.getLogin = (req, res) => {
    const failed = req.session.failed || false;
    res.render('../views/login', {
        csrfToken: req.csrfToken(),
        failed,
    });
};

exports.postLogin = async (req, res) => {
    try {
        // search user by email
        const [rows] = await User.fetchOne(req.body.email);

        if (rows.length === 0) {
            req.session.failed = "Incorrect email or password";
            return res.redirect("/login");
        }

        const user = rows[0];

        // Verificar contraseña
        const doMatch = await bcrypt.compare(req.body.password, user.password);
        if (!doMatch) {
            req.session.failed = "Incorrect email or password";
            return res.redirect("/login");
        }

        // verify admin role
        const [[roleRow]] = await User.getRolByUserId(user.IDUser);

        if (!roleRow || roleRow.rol.toLowerCase() !== "admin") {
            req.session.failed = "You do not have permission to log in";
            return res.redirect("/login");
        }

        // save basic data in session
        req.session.idUsuario = user.IDUser;
        req.session.name = user.name;
        req.session.email = user.email;
        req.session.gender = user.gender;
        req.session.dateOfBirth = user.dateOfBirth;
        req.session.isLoggedIn = true;

        //save session and redirect
        req.session.save(err => {
            if (err) console.error("Error saving session:", err);
            res.redirect("/");
        });

    } catch (error) {
        req.session.failed = "Database error";
        console.error(error);
        res.redirect("/login");
    }
};
