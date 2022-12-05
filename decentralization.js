//custom middleware
function requiresLogin(req, res, next) {
    if (req.session["User"]) {
        return next()
    } else {
        res.redirect('/login')
    }
}

function requireAdmin(req, res, next) {
    if (req.session["Admin"]) {
        return next()
    } else {
        res.redirect('/login')
    }
}

function requireStudent(req, res, next) {
    if (req.session["Student"]) {
        return next()
    } else {
        res.redirect('/login')
    }
}

function requireTeacher(req, res, next) {
    if (req.session["Teacher"]) {
        return next()
    } else {
        res.redirect('/login')
    }
}


module.exports = {
    requiresLogin,
    requireAdmin,
    requireStudent,
    requireTeacher
}