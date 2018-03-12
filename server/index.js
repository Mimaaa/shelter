'use strict'

var express = require('express')
var db = require('../db')
var helpers = require('./helpers')
var bodyParser = require('body-parser')
var multer = require('multer')

module.exports = express()
  .use(express.static('static'))
  .use('/image', express.static('db/image'))
  .use(bodyParser.urlencoded({ extended: true }))
  .set('view engine', 'ejs')
  .set('views', 'view')
  .get('/', all)
  .get('/add', form)
  .get('/:id', get)
  .post('/', add)
  /* TODO: Other HTTP methods. */
  // .put('/:id', set)
  // .patch('/:id', change)
  .delete('/:id', remove)
  .listen(1902)

function all(req, res) {
  var result = {errors: [], data: db.all()}

  res.format({
    json: function () {
      return res.json(result)
    },
    html: function () {
      return res.render('list.ejs', Object.assign({}, result, helpers))
    }
  })
}

function get(req, res) {
  var id = req.params.id
  var result = {errors: [], data: undefined}
  var has

  try {
    has = db.has(id)
  } catch (err) {
    result.errors.push({id : 400, title : 'bad request'})
    res.status(400).render('error.ejs', Object.assign({}, result, helpers))
    return
  }

  if (has) {
    result.data = db.get(id)
    res.format({
      json: function () {
        return res.json(result)
      },
      html: function () {
        return res.render('detail.ejs', Object.assign({}, result, helpers))
      }
    })
  } else if (db.removed(id)) {
    result.errors.push({ id: 410, title: 'gone' })
    res.status(410).render('error.ejs', Object.assign({}, result, helpers))
    console.log(result.data)
  } else {
    result.errors.push({ id: 404, title: 'not found' })
    res.status(404).render('error.ejs', Object.assign({}, result, helpers))
  }
}

function remove(req, res) {
  var id = req.params.id
  var result = { errors: [], data: undefined }
  var has

  try {
    has = db.has(id)
  } catch (err) {
    result.errors.push({id : 400, title : 'bad request'})
    res.status(400).render('error.ejs', Object.assign({}, result, helpers))
    return
  }

  if (has) {
    result.data = db.remove(id)
    res.status(204)
    res.format({
      json: function () {
        return res.json(result)
      }
    })
  } else {
    result.data = db.removed(id)
    result.errors.push({id : 410, title: 'gone'})
    res.status(410).render('error.ejs', Object.assign({}, result, helpers))
    console.log(result.data)
  }
}

function form(req, res) {
  res.render('add')
}

function add(req, res) {
  var result = { errors: [], data: undefined }
  var body = req.body
  var animalProperties = {
    name: body.name,
    type: body.type,
    age: Number(body.age),
    sex: body.sex,
    weigth: Number(body.weight),
    size: body.size,
    length: body.length,
    coat: body.coat,
    vaccinated: body.vaccinated === "yes",
    declawed: body.type === "cat" ? body.declawed === "yes" : undefined,
    primaryColor: body.primaryColor,
    secondaryColor: body.secondaryColor || null,
    description: body.description || null,
    place: body.place,
    intake: body.intake
  }
  console.log(animalProperties)

  try {
    var newAnimal = db.add(animalProperties)
    console.log(newAnimal.id)
    res.redirect('/' + newAnimal.id)
  } catch (err) {
    result.errors.push({ id: 422, title: 'unprocessable entity' })
    res.status(422).render('error.ejs', Object.assign({}, result, helpers))
    console.log(err)
    return
  }
}

// Add support for uploading images as well (tip: multer, and don’t
// forget enctype = "multipart/form-data" on the form).Store images
// in db / images.Accept only JPEG images: use accept = "image/jpeg"
// on file inputs and multer’s fileFilter.Remove uploaded images if
// the POST fails.Move uploaded images to $id.jpg, where $id is the
// animal’s identifier, if the post succeeds
