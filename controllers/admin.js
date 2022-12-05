const express = require('express')
const res = require('express/lib/response')
const { render } = require('express/lib/response')
const async = require('hbs/lib/async')
const multer = require('multer')
const path = require('path')
const { ObjectId } = require('mongodb')
const { insertObject, getDB, DeleteStudent, DeleteTeacher, DeleteClass } = require('../databaseHandler')
const { requireAdmin } = require('../decentralization')
const { title } = require('process')
const router = express.Router()

router.use(express.static('public'))

router.get('/', requireAdmin, (req, res) => {
    const user = req.session["Admin"]
    res.render('adminIndex', { user: user })
})


router.get('/addUser', (req, res) => {
    res.render('addUser')
})
//User
router.post('/addUser', (req, res) => {
    const name = req.body.txtName
    const role = req.body.Role
    const pass = req.body.txtPassword
    const objectToInsert = {
        userName: name,
        role: role,
        password: pass
    }
    insertObject("Users", objectToInsert)
    res.render('adminIndex')
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


//Student
router.get('/addStudent', requireAdmin, (req, res) => {
    const user = req.session["Admin"]
    res.render('addStudent', { user: user })
})

router.post('/addStudent', upload.array('myFiles'), requireAdmin, async (req, res) => {
    const name = req.body.studentName
    const age = req.body.studentAge
    const phone = req.body.phone
    const address = req.body.address
    const email = req.body.email
    const username = req.body.username
    const password = req.body.password
    const files = req.files
    const submitAssignment = []


    const objectToUsers = {
        userName: username,
        role: 'Student',
        password: password
    }
    const objectToStudents = {
        name: name,
        age: age,
        role: 'Student',
        password: password,
        address: address,
        phone_number: phone,
        email: email,
        files: files,
        userName: username,
        submitAssignment:submitAssignment
    }

    await insertObject("Users", objectToUsers)
    insertObject("Students", objectToStudents)
    res.redirect('manageStudent')
})

router.get('/manageStudent', requireAdmin, async (req, res) => {
    const user = req.session["Admin"]
    const dbo = await getDB();
    const allStudents = await dbo.collection('Students').find({}).toArray();
    res.render('manageStudent', { data: allStudents, user: user })
})

router.get('/deleteStudent', requireAdmin, async (req, res) => {
    const us = req.query.userName
    await DeleteStudent(us);
    res.redirect('manageStudent')
})

router.get('/resetPassword', requireAdmin, async (req, res) => {
    const us = req.query.userName
    const dbo = await getDB();
    await dbo.collection("Users").updateOne({ 'userName': us }, { $set: { password: '1' } })
    res.redirect('manageStudent')
})



//Teacher
router.get('/addTeacher', requireAdmin, (req, res) => {
    const user = req.session["Admin"]
    res.render('addTeacher', { user: user })
})

router.post('/addTeacher', upload.array('myFiles'), requireAdmin, async (req, res) => {
    const password = req.body.password
    const name = req.body.TeacherName
    const age = req.body.TeacherAge
    const phone = req.body.phone
    const address = req.body.address
    const email = req.body.email
    const files = req.files
    const username = req.body.username


    const objectToUsers = {
        userName: username,
        role: 'Teacher',
        password: password
    }
    const objectToTeachers = {
        role: 'Teacher',
        password: password,
        name: name,
        age: age,
        address: address,
        phone_number: phone,
        email: email,
        files: files,
        userName: username
    }

    await insertObject("Users", objectToUsers)
    insertObject("Teachers", objectToTeachers)
    res.redirect('manageTeacher')
})

router.get('/manageTeacher', requireAdmin, async (req, res) => {
    const user = req.session["Admin"]
    const dbo = await getDB();
    const allTeachers = await dbo.collection('Teachers').find({}).toArray();
    res.render('manageTeacher', { teacher: allTeachers, user: user })
})

router.get('/deleteTeacher', requireAdmin, async (req, res) => {
    const us = req.query.userName
    await DeleteTeacher(us);
    res.redirect('manageTeacher')
})

router.get('/reset_password', requireAdmin, async (req, res) => {
    const us = req.query.userName
    const dbo = await getDB();
    await dbo.collection("Users").updateOne({ 'userName': us }, { $set: { password: '1' } })
    res.redirect('manageTeacher')
})

//Class
router.get('/addClass', requireAdmin, (req, res) => {
    const user = req.session["Admin"]
    res.render('addClass', { user: user })
})

router.post('/addClass', requireAdmin, async (req, res) => {
    const className = req.body.className
    const course = req.body.course
    const allTitle = []
    const comment = []
    const students = []
    const objectToClasses = {
        className: className,
        course: course,
        allTitle:allTitle,
        comment:comment,
        students:students
    }

    await insertObject("Classes", objectToClasses)
    res.redirect('manageClass')
})


router.get('/manageClass', requireAdmin, async (req, res) => {
    const user = req.session["Admin"]
    const dbo = await getDB();
    const allClasses = await dbo.collection('Classes').find({}).toArray();
    res.render('manageClass', { data: allClasses, user: user })
})

router.get('/addClassStudent',requireAdmin, async(req, res) => {
    const id = req.query.id;
    const db = await getDB();
    const s = await db.collection("Students").findOne({ _id: ObjectId(id) });
    const cl = await db.collection("Classes").find({}).toArray();

    const newClasses = []

    if (s.Classes == null) {
        cl.forEach(c => {
            newClasses.push(c.className)

        });
    } else if (!Array.isArray(s.Classes)) {
        s.Classes = [s.Classes]
        cl.forEach(c => {
            if (!s.Classes.includes(c.className)) {
                newClasses.push(c.className)

            }
        });
    } else {
        cl.forEach(c => {
            if (!s.Classes.includes(c.className)) {
                newClasses.push(c.className)
            }
        });
    }

    res.render('addClassStudent', { student: s, new: newClasses });
})

router.post('/addClassToStudent', async(req, res) => {
    const id = req.body.txtID;
    const classID = req.body.CS;
    const dbo = await getDB();
 
    const filter = { _id: ObjectId(id) }
    const classToStudent = {
        $set: {
            Classes: classID
        }
    }

    await dbo.collection("Students").updateOne(filter, classToStudent)

    

    res.redirect('/admin/manageStudent')
})




router.get('/addClassTeacher',requireAdmin, async(req, res) => {
    const id = req.query.id;
    const db = await getDB();
    const t = await db.collection("Teachers").findOne({ _id: ObjectId(id) });
    const cl = await db.collection("Classes").find({}).toArray();

    const newClasses = []
    if (t.Classes == null) {
        cl.forEach(c => {
            newClasses.push(c.className)
        });
    } else if (!Array.isArray(t.Classes)) {
        t.Classes = [t.Classes]
        cl.forEach(c => {
            if (!t.Classes.includes(c.className)) {
                newClasses.push(c.className)
            }
        });
    } else {
        cl.forEach(c => {
            if (!t.Classes.includes(c.className)) {
                newClasses.push(c.className)
            }
        });
    }

    res.render('addClassTeacher', { teacher: t, new: newClasses });
})

router.post('/addClassesToTeacher', async(req, res) => {
    const id = req.body.txtID;
    const classID = req.body.CT;
    const dbo = await getDB();
    const filter = { _id: ObjectId(id) }
    const classesToTeacher = {
        $set: {
            Classes: classID
        }
    }
    await dbo.collection("Teachers").updateOne(filter, classesToTeacher)

    res.redirect('/admin/manageTeacher')
})

router.get('/deleteClass', requireAdmin, async (req, res) => {
    const dcl = req.query.className
    await DeleteClass(dcl);
    res.redirect('manageClass')
})

//admin
router.get('/updateAdmin', requireAdmin, async (req, res) => {
    const user = req.session["Admin"]
    const dbo = await getDB()
    const us = await dbo.collection("Users").findOne({ "userName": user.name })
    res.render('updateAdmin', { u: us })
})

router.post('/editAdmin', requireAdmin, async (req, res) => {
    const id = req.body.txtId
    const user = req.body.txtUser
    const pass = req.body.txtPass

    const update = {
        $set: {
            userName: user,
            password: pass
        }
    }

    req.session["Admin"] = { name: user }

    const filter = { _id: ObjectId(id) }
    const dbo = getDB();
    (await dbo).collection("Users").updateOne(filter, update)

    res.redirect("/admin")
})


router.get('/detailUser', requireAdmin, async (req, res) => {
    const id = req.query.id
    const user = req.session["Admin"]
    const dbo = await getDB()
    const student = await dbo.collection("Students").findOne({ "_id": ObjectId(id) })
    const teacher = await dbo.collection("Teachers").findOne({ "_id": ObjectId(id) })

    if (student) {
        detail = student
    } else {
        detail = teacher
    }

    res.render('detailUser', { data: detail, user: user })
})

router.get('/editUser', requireAdmin, async (req, res) => {
    const user = req.session["Admin"]
    const dbo = await getDB()
    const usr = await dbo.collection("Users").findOne({ "userName": user.name })
    res.render('editUser', { ur: usr })
})

router.post('/editUser', requireAdmin, async (req, res) => {
    const id = req.body.txtID
    const name = req.body.UserName
    const age = req.body.age
    const phone = req.body.phone
    const address = req.body.address
    const email = req.body.email
    const files = req.files
    const username = req.body.username

    const update = {
        $set: {
            name: name,
            age: age,
            address: address,
            phone_number: phone,
            email: email,
            files: files,
            userName: username
        }
    }

    const filter = { _id: ObjectId(id) }
    const dbo = getDB();
    await dbo.collection("Users").updateOne(filter, update)

    res.redirect("detailUser")
})

router.post('/search', async (req, res) => {
    const search = req.body.txtSearch
    const user = req.session["Admin"]
    const dbo = await getDB()
    const student = await dbo.collection("Students").findOne({ "name": search })
    const teacher = await dbo.collection("Teachers").findOne({ "name": search })

    if (student) {
        sr = student
    } else {
        sr = teacher
    }

    res.render('detailUser', { data: sr, user: user })
})

module.exports = router;