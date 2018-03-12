'use strict'

var express = require('express')
var find = require('array-find')
var db = require('../db')
var helpers = require('./helpers')
var slug = require('slug')
var bodyParser = require('body-parser')

module.exports = express()
  .use(express.static('static'))
  .use('/image', express.static('db/image'))
  .use(bodyParser.urlencoded({ extended: true }))
  .set('view engine', 'ejs')
  .set('views', 'view')
  .get('/', all)
  .get('/add', add)
  .get('/:id', get)
  /* TODO: Other HTTP methods. */
  // .post('/', add)
  // .put('/:id', set)
  // .patch('/:id', change)
  .delete('/:id', remove)
  .listen(1902)

function all(req, res) {
  var result = {errors: [], data: db.all()}
  res.render('list.ejs', Object.assign({}, result, helpers))
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
      json: () => res.json(result),
      html: () => res.render('detail.ejs', Object.assign({}, result, helpers))
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
      json: () => res.json(result)
    })
  } else {
    result.data = db.removed(id)
    result.errors.push({id : 410, title: 'gone'})
    res.status(410).render('error.ejs', Object.assign({}, result, helpers))
    console.log(result.data)
  }
}

function add(req, res) {
  res.render('add')
}

