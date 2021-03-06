const mongoose = require('mongoose');
const axios = require('axios');
const { google } = require('googleapis')
const { OAuth2 } = google.auth
const { OAuth2Client } = require('google-auth-library');
const Contest = mongoose.model("Contest");
const User = mongoose.model("User");



const auth = function (req, res) {
  const CLIENT_ID = '966641561326-7nivlb5sna5dpcloaot4d51oba9n46ej.apps.googleusercontent.com'
  const client = new OAuth2Client(CLIENT_ID);
  let token = req.body.token;
  let profile = req.body.profile;
  let user = new User();
  user.name = profile.Se;
  user.email = profile.Tt;
  user.save((err, user) => {
    if (err) {
      if (err.errmsg && err.errmsg.includes("duplicate key error") && err.errmsg.includes("email")) {
        console.log("Email already exists");
      } else console.log("Something went wrong");
    } else {
      console.log("New user added");;
    }
  })
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];

    // console.log(payload)
  }
  verify()
    .then(() => {
      res.cookie('session-token', token);
      res.send('success');
    })
    .catch(console.error);


}


const clist = async function () {

  return new Promise(function (resolve, reject) {

    let clist_token = 'username=priyanshu_x&api_key=1e0a1d7b14cf84194ca2a240efc8e735b28b9422'
    let URL_BASE = 'https://clist.by/api/v2/'

    var d = new Date();
    d.setDate(d.getDate() - 2);


    var c = JSON.stringify(d)
    c = c.substring(1)
    c = c.slice(0, -1)


    let url = URL_BASE + 'contest/?limit=20&start__gte=' + c + '&' + clist_token
    let contestsAdded = [];


    axios.get(url)
      .then(r => {
        let contests = r.data.objects;
        for (let contest of contests) {
          let newContest = new Contest();
          newContest.host = contest.host;
          newContest.id = contest.id;
          newContest.link = contest.href;
          newContest.event = contest.event;
          newContest.start = contest.start;
          newContest.end = contest.end;

          newContest.save((err, val) => {

            if (err) {
              if (err.errmsg && err.errmsg.includes("duplicate key error") && err.errmsg.includes("email")) {
                console.log("Email already exists");
              } else console.log("Something went wrong ");
            } else {
              contestsAdded.push(newContest);
            }
          })
        }

        resolve("Fetched data correctly from the clist added it to the database")
      })
      .catch(error => {
        console.log(error);
        resolve(error)
      })
  });
}



const addCalendar = async function () {

  clist()
    .then(returnValefromClist => {
      console.log(returnValefromClist)



      // Create a new instance of oAuth and set our Client ID & Client Secret.
      const oAuth2Client = new OAuth2(
        '966641561326-7nivlb5sna5dpcloaot4d51oba9n46ej.apps.googleusercontent.com',
        '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'
      )

      // Call the setCredentials method on our oAuth2Client instance and set our refresh token.
      oAuth2Client.setCredentials({
        refresh_token: '1//04iiZC-nUI3osCgYIARAAGAQSNwF-L9IrJ6GfxfDrVx6wDvoJCzo8Kkl52y63LTtjYsA7srILnQ3YiXY018vmW1Lr7saYyEy8Qww',
      })


      // Create a new calender instance.
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })


      // var allRecentContest
      const retriveContestData = new Promise((resolve, reject) => {
        Contest.find((err, contests) => {
          // console.log(contests)
          if (err) {
            console.log("error at 125", err);
            return res.json({ err: err })
          }
          else {
            resolve(contests);
          }
        })
      })
      const retriveUserData = new Promise((resolve, reject) => {
        User.find((err, users) => {
          if (err) {
            console.log("error at 145", err);
            return res.json({ err: err })
          }
          else {
            resolve(users);
          }
        })
      })

      var newEventCreater = function (event) {

        return new Promise(function (resolve, reject) {
          calendar.events.insert(
            { calendarId: 'primary', resource: event },
            err => {

              if (err) {
                console.log('Error Creating Calender Event: Event already present')
                resolve(event)
              }
              // Else log that the event was created.
              else {
                console.log("-----------------shuru-------------------")
                console.log('Calendar event successfully created.');
                console.log(event.id)
                console.log(event.start.dateTime)
                console.log(event.start.dateTime)
                console.log("-----------------khtm-------------------")

                resolve(event)
              }
            }
          )
        });

      }




      Promise.all([retriveContestData, retriveUserData])
        .then(async function (values) {


          for (let contest of values[0]) {
            // console.log(contest)
            var event = {
              summary: contest.event,
              description: contest.link,
              id: 'aaabbbaaacd' + contest.id,
              colorId: 1,
              start: {
                dateTime: contest.start,
                timeZone: 'IST',
              },
              end: {
                dateTime: contest.end,
                timeZone: 'IST',
              },
              attendees: []
            };





            for (let user of values[1]) {
              event.attendees.push({ email: user.email })
              if (user.addedContests.find(
                function (vals) {
                  if (vals == contest.id)
                    return true;
                  else
                    return false;
                }
              ) == undefined) {
                // save that this contest is added for the user
                user.addedContests.push(contest.id);
                user.save();
              }

            }


            newEventCreater(event)
              .then(eventforUpdate => {
                setTimeout(() => {
                  var params = {
                    calendarId: 'primary',
                    eventId: eventforUpdate.id,
                    resource: eventforUpdate
                  };
  
  
                  calendar.events.update(params, function (err) {
                    if (err) {
                      console.log('The API returned an error: ' + err);
                      return;
                    }
                    console.log('Event updated.');
                  });
                }, 10000);
              })
              .catch(err => {
                console.log(err)
              })

          }

        })
        .catch(err => {
          console.log("Error occured in making promises: ", err)
        })


      console.log("Events updated successfully");
    })
    .then(err=> {
      console.log(err)
    })
}

// Useless Stuffs
const clearCalendar = function (req, res) {

  const oAuth2Client = new OAuth2(
    '966641561326-7nivlb5sna5dpcloaot4d51oba9n46ej.apps.googleusercontent.com',
    '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'
  )

  // Call the setCredentials method on our oAuth2Client instance and set our refresh token.
  oAuth2Client.setCredentials({
    refresh_token: '1//04iiZC-nUI3osCgYIARAAGAQSNwF-L9IrJ6GfxfDrVx6wDvoJCzo8Kkl52y63LTtjYsA7srILnQ3YiXY018vmW1Lr7saYyEy8Qww',
  })


  // Create a new calender instance.
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })


  // var allRecentContest
  const retriveContestData = new Promise((resolve, reject) => {
    Contest.find((err, contests) => {
      // console.log(contests)
      if (err) {
        console.log("error at 125", err);
        return res.json({ err: err })
      }
      else {
        resolve(contests);
      }
    })
  })
  const retriveUserData = new Promise((resolve, reject) => {
    User.find((err, users) => {
      if (err) {
        console.log("error at 145", err);
        return res.json({ err: err })
      }
      else {
        resolve(users);
      }
    })
  })



  Promise.all([retriveContestData, retriveUserData])
    .then(values => {
      for (let contest of values[0]) {
        for (let user of values[1]) {

          if (user.addedContests.find(
            function (vals) {
              if (vals == contest.id)
                return true;
              else
                return false;
            }
          ) == undefined) {
            // do nothing if not present
          }
          else {

            var params = {
              calendarId: 'primary',
              eventId: 'aabba' + contest.id,
            };

            calendar.events.delete(params, function (err) {
              if (err) {
                console.log('The API returned an error: ' + err);
                return;
              }
              console.log('Event deleted.');
            });
          }
        }

      }
    })
    .catch(err => {
      console.log("Error occured in making promises: ", err)
    })
}
const deleteAllUsers = function (req, res) {
  User.deleteMany({}, (err, info) => {
    if (err) {
      return res.send({ error: err });
    }
    return res.send({ message: "Deleted All Users", info: info })
  })
}
const deleteAllContest = function (req, res) {
  Contest.deleteMany({}, (err, info) => {
    if (err) {
      return res.send({ error: err });
    }
    return res.send({ message: "Deleted All Contest ", info: info })
  })
}




module.exports = {
  // register,
  // clist,
  auth,
  addCalendar
  // deleteAllUsers,
  // deleteAllContest,
  // clearCalendar
}
