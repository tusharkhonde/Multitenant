	var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('scrum', { title: 'Welcome' });
});

router.get('/signup', function(req, res) {
    // Process the data received in req.body
    res.render('signup', { title: 'Welcome' });
});

router.get('/login', function(req, res) {
    // Process the data received in req.body
    res.render('login', { title: 'Welcome' });
});

router.get('/index', function(req, res) {
    // Process the data received in req.body
    res.render('index', { title: 'Welcome' });
});


module.exports = router;
