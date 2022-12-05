const express = require('express')
const res = require('express/lib/response')
const { render } = require('express/lib/response')
const async = require('hbs/lib/async')
const { ObjectId } = require('mongodb')
const { insertObject, getDB } = require('../databaseHandler')
const { requireStudent } = require('../decentralization')
const router = express.Router()
const cloudinary = require("cloudinary")

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME || "dpof7lfeh",
    api_key: process.env.CLOUDINARY_KEY || "979798858651942",
    api_secret: process.env.CLOUDINARY_SECRET || "zCODF78OQsajqwDIAs_wztn16RI"
  });
  
const cloudinaryInstance= cloudinary.v2

const multer = require('multer')
const path = require('path')


router.use(express.static('public'))

router.get('/', requireStudent, (req, res) => {
    const user = req.session["Student"]
    res.render('studentIndex', { user: user })
})


router.get('/classesStudent', requireStudent, async (req, res) => {

    const user = req.session["Student"]
    const dbo = await getDB();
    const allClass = await dbo.collection("Students").findOne({ userName: user.name })
    res.render('classesStudent', { clss: allClass, user: user })
})

router.get('/detailClassStudent', requireStudent, async (req, res) => {
    const user = req.session["Student"]
    const className = req.query.className;
    const dbo = await getDB();
    const assignment = await dbo.collection('HomeWork').find({ className: className }).toArray();
    // console.log(assignment);
    res.render('detailClassStudent', { assignment: assignment, class: className });
})

router.get('/detailHWStudent', requireStudent, async (req, res) => {
    const title = req.query.title;
    const user = req.session["Student"]
    const dbo = await getDB();
    const student = await dbo.collection("Students").findOne({ userName: user.name })
    const assignment = await dbo.collection('HomeWork').findOne({ title: title });
    // console.log(student)
    res.render('detailHWStudent', { assignment: assignment, student: student, userName: user.name, title: title })
})


//submit ass
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/submit')
    },
    filename: (req, file, cb) => {
        var datetimestamp = Date.now()
        cb(null, file.fieldname + '_' + datetimestamp + path.extname(file.originalname))
    }
})

const fileFilter = (req, file, cb) => {
    var ext = path.extname(file.originalname)
    if (ext !== '.doc' && ext !== '.docx') {
        return cb(new Error('Please upload file png or jpg!'))
    }
    cb(null, true)
}

router.get('/submitAssignment', requireStudent, (req, res) => {
    const user = req.session["Student"]
    const title = req.query.title
    res.render('submitAssignment', { user: user, title: title })
})

var upload = multer({ storage: storage, fileFilter: fileFilter })

router.post('/submitAssignment', upload.array('myFiles'), requireStudent, async (req, res) => {
    let result_url= ''
    const user = req.session["Student"]
    const title = req.body.title
    const files = req.files
    console.log(files)
    const score = req.body.score
    const dbo = await getDB();
    const student = await dbo.collection("Students").findOne({ userName: user.name })
    await cloudinaryInstance.uploader.upload("./public/submit/"+ files?.[0].filename ,  { resource_type: "raw" }, 
       async function(error, result) {
            await dbo.collection('Students').updateOne({ userName: user.name }, {
                $push: {
                    'submitAssignment': {
                        'title': title,
                        'file': files,
                        'score':score,
                        'file_url': result.secure_url
                    }
        
                }
            })
            await dbo.collection('HomeWork').updateOne({ title: title }, {
                $push: {
                    'submitAss':{
                        'title':title,
                        'student': student.name,
                        'file': files,
                        'score':score,
                        'file_url': result.secure_url
                    }
                    
                }
            })
        
        })
    
    res.redirect('detailHWStudent?title='+title)
})

var storages = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads')
    },
    filename: (req, file, cb) => {
        var datetimestamp = Date.now()
        cb(null, file.fieldname + '_' + datetimestamp + path.extname(file.originalname))
    }
})

const fileFilters = (req, file, cb) => {
    var ext = path.extname(file.originalname)
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
        return cb(new Error('Please upload file png or jpg!'))
    }
    cb(null, true)
}

var uploads = multer({ storage: storages, fileFilter: fileFilters })

router.get('/profileStudent', requireStudent, async (req, res) => {
    const user = req.session["Student"]
    const dbo = await getDB()
    const st = await dbo.collection("Students").findOne({ "userName": user.name })
    res.render('profileStudent', { student: st })
})

router.get('/editStudent', requireStudent, async (req, res) => {
    const user = req.session["Student"]
    const dbo = await getDB()
    const st = await dbo.collection("Students").findOne({ "userName": user.name })
    res.render('editStudent', { student: st })
})

router.post('/editStudent',uploads.array('myFile'), requireStudent, async (req, res) => {
    const id = req.body.txtID
    const name = req.body.name
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
    const dbo = await getDB();
    await dbo.collection("Students").updateOne(filter, update)
    const st = await dbo.collection('Students').findOne({ _id: ObjectId(id) });

    res.render("profileStudent", { student: st})
})

router.post("/get_mark", async (req, res)=> {
    const dbo = await getDB();

        const allClass = await dbo.collection("HomeWork").findOne({ title: req.body.title,submitAss: {$elemMatch: {student: req.body.user_name}} })
        return res.json({allClass})
   
})

//Comment newspaper
router.post("/user-comment", async (req, res) => {
    console.log("connected comment");
    const account = req.session["Student"]

    const title = req.body.title;
    const comment = req.body.comment;
    //date time current
    const d = new Date();
    var minutes = d.getMinutes();
    var formatDate = ""

    if (minutes > 9) {
        formatDate = [d.getHours(), d.getMinutes()].join(':') + ' ' + [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('/')
    } else {
        var minutes = '0' + minutes;
        formatDate = [d.getHours(), minutes].join(':') + ' ' + [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('/')
    }
    const date = formatDate;

    const db = await getDB();
    const user = await db.collection('Students').findOne({ 'userName': account.name })
    await db.collection('HomeWork').updateOne({ title: title }, {
        $push: {
            'comment': {
                "user": user.name,
                "comments": comment,
                "date": date
            }
        }
    })
    return;
})

module.exports = router;