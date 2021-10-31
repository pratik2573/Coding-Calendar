var express = require('express');
var router = express.Router();

const usersCtrl = require('../controllers/user');
const middleware = require('./middleware');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/register',usersCtrl.register);

router.get('/fetch',usersCtrl.clist);

router.get('/login',(req,res)=>{
  res.render('login');
})

router.post('/login',usersCtrl.auth);

router.get('/logout', (req, res)=>{
  res.clearCookie('session-token');
  res.redirect('/users/login')
})

router.get('/dashboard', middleware.checkAuthenticated, (req, res)=>{
  let user = req.user;
  res.render('dashboard', {user});
})
module.exports = router;
