const express = require('express')
const session = require('express-session')
const { checkUserRole } = require('./databaseHandler')
const { requiresLogin } = require('./decentralization')
const { ObjectId } = require('mongodb')
const { insertObject, getDB } = require('./databaseHandler')
const multer = require('multer')
const path = require('path')

const admz = require('adm-zip')

const app = express()

app.set('view engine', 'hbs')

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({ secret: '124447yd@@$%%#', cookie: { maxAge: 900000 }, saveUninitialized: false, resave: false }))

app.get('/', (req, res) => {
    res.render('login')
})


var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads')
    },
    filename: (req, file, cb) => {
        var datetimestamp = Date.now()
        cb(null, file.fieldname + '_' + datetimestamp + path.extname(file.originalname))
    }
})

const fileFilter = (req, file, cb) => {
    var ext = path.extname(file.originalname)
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
        return cb(new Error('Please upload file png or jpg!'))
    }
    cb(null, true)
}
var upload = multer({ storage: storage, fileFilter: fileFilter })

app.get('/register', (req, res) => {
    res.render('register')
})

app.post('/register', upload.array('myFiles'), async (req, res) => {
    const name = req.body.studentName
    const age = req.body.studentAge
    const phone = req.body.phone
    const address = req.body.address
    const email = req.body.email
    const username = req.body.username
    const role = req.body.role
    const password = req.body.password
    const files = req.files
    const submitAssignment = []


    const objectToUsers = {
        userName: username,
        role: role,
        password: password
    }

    if (role == "Student") {
        const objectToStudents = {
            name: name,
            age: age,
            role: role,
            password: password,
            address: address,
            phone_number: phone,
            email: email,
            files: files,
            userName: username,
            submitAssignment: submitAssignment
        }
        await insertObject("Users", objectToUsers)
        insertObject("Students", objectToStudents)

    } else {
        const objectToTeachers = {
            name: name,
            age: age,
            role: role,
            password: password,
            address: address,
            phone_number: phone,
            email: email,
            files: files,
            userName: username
        }
        await insertObject("Users", objectToUsers)
        insertObject("Teachers", objectToTeachers)
    }

    res.redirect('/')
})

app.get('/login', (req, res) => {
    res.render('login')
})


app.post('/login', async (req, res) => {

    const name = req.body.txtName
    const pass = req.body.txtPass
    const role = await checkUserRole(name, pass)
    if (role == -1) {

        res.render('login')
    } else if (role == "Admin") {
        req.session["Admin"] = {
            name: name,
            role: role
        }
        res.redirect('/admin')

    } else if (role == "Student") {
        req.session["Student"] = {
            name: name,
            role: role
        }
        res.redirect('/student')

    } else if (role == "Teacher") {
        req.session["Teacher"] = {
            name: name,
            role: role
        }
        res.redirect('/teacher')
    }
})



app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('login')
})


// download zip
app.get('/downloadzip', (req, res) => {
    var zp = new admz()
    const filename = req.query.filename

    zp.addLocalFile(__dirname + '/' + 'public/uploads' + '/' + filename)
    const file_downloaded = "" + filename.split('.')[0] + ".zip"

    const data = zp.toBuffer()

    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename=${file_downloaded}`);
    res.set('Content-Length', data.length);
    res.send(data);
})

app.get('/downloadzipp', (req, res) => {
    var zp = new admz()
    const filename = req.query.filename

    zp.addLocalFile(__dirname + '/' + 'public/submit' + '/' + filename)
    const file_downloaded = "" + filename.split('.')[0] + ".zip"

    const data = zp.toBuffer()

    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename=${file_downloaded}`);
    res.set('Content-Length', data.length);
    res.send(data);
})

const adminController = require('./controllers/admin')
app.use('/admin', adminController)

const studentController = require('./controllers/student')
app.use('/student', studentController)

const teacherController = require('./controllers/teacher')

app.use('/teacher', teacherController)


const PORT = process.env.PORT || 2000
app.listen(PORT)
console.log("Server is running! " + PORT)