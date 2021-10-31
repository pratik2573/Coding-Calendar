const mongoose = require('mongoose');
const axios = require('axios');
const {OAuth2Client} = require('google-auth-library');
const register = function({body},res)
{
    if (
        !body.first_name ||
        !body.last_name ||
        !body.email
      ) {
        return res.send({ message: "All Feilds are required" })
      }
    
      let user = new User();
      user.name = body.first_name.trim() + " " + body.last_name.trim();
    
      user.email = body.email;
      user.save((err, newUser) => {
        if (err) {
          if (err.errmsg && err.errmsg.includes("duplicate key error") && err.errmsg.includes("email")) {
            return res.json({ message: "Email already exists" });
          }
          res.json({ message: "Something went wrong" });
        } else {
          res.status(201).json({ message:"Added successfully" });
        }
      })
}
const auth = function(req,res)
{
  const CLIENT_ID = '966641561326-7nivlb5sna5dpcloaot4d51oba9n46ej.apps.googleusercontent.com'
  const client = new OAuth2Client(CLIENT_ID);
  let token = req.body.token;
    // console.log(token)

    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];

        console.log(payload)
      }
      verify()
      .then(()=>{
          res.cookie('session-token', token);
          res.send('success');
      })
      .catch(console.error);
}
const clist = async function(req,res)
{
  let urlsuff = '/?username=physics1739&api_key=6e9db85be21e694af856ac4c6a34371342f103d9'
  let urlpref = 'https://clist.by/api/v1/contest'
  let url = urlpref+urlsuff;
  axios.get(url)
  .then(r => {
    res.json({ response: r.data.objects });
  })
  .catch(error =>{
    console.log(error);
  })
}
module.exports = {
    register,
    clist,
    auth
}