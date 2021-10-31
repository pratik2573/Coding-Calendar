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
  // console.log(token)
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
      //       let tmp = JSON.parse(token);
      // console.log(tmp);
      res.cookie('session-token', token);
      res.send('success');
    })
    .catch(console.error);


}


const clist = async function () {
  let clist_token = 'username=priyanshu_x&api_key=1e0a1d7b14cf84194ca2a240efc8e735b28b9422'
  let URL_BASE = 'https://clist.by/api/v2/'

  var d = new Date();
  d.setDate(d.getDate() - 2);

  console.log(d)
  var c = JSON.stringify(d)
  c = c.substring(1)
  c = c.slice(0, -1)

  console.log(c)

  let url = URL_BASE + 'contest/?limit=20&start__gte=' + c + '&' + clist_token
  let contestsAdded = [];
  // console.log(url)

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
        console.log(newContest);
        newContest.save((err, val) => {
          if (err) {
            if (err.errmsg && err.errmsg.includes("duplicate key error") && err.errmsg.includes("email")) {
              console.log("Email already exists");
            } else console.log("Something went wrong");
          } else {
            contestsAdded.push(newContest);
          }
        })
      }
      console.log( "contest added successfully");
    })
    .catch(error => {
      console.log(error);
    })
}

const addCalendar = async function () {
  clist();
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


  // Create a new event start date instance for temp uses in our calendar.
  // var eventStartTime = new Date()
  // eventStartTime.setDate(eventStartTime.getDay())

  // Create a new event end date instance for temp uses in our calendar.
  // var eventEndTime = new Date()
  // eventEndTime.setDate(eventEndTime.getDay())
  // eventEndTime.setMinutes(eventEndTime.getMinutes() + 45)

  // Create a dummy event for temp uses in our calendar
  Contest.find((err, contests) => {
    if (err) {
      console.log("error at 125", err);
    } else {
      for (let contest of contests) {
        let tmp = contest.event + contest.link;
        var event = {
          summary: contest.event,
          description: tmp,
          colorId: 1,
          start: {
            dateTime: contest.start,
            timeZone: 'IST',
          },
          end: {
            dateTime: contest.end,
            timeZone: 'IST',
          },
          attendees: [{
            email: 'abc'
          }]
        }
        User.find((err, users) => {
          if (err) console.log("error at 145", err);
          else {
            for (let user of users) {
              console.log(user);
              if (user.addedContests.length > 0 && user.addedContests.find(contest.id) == undefined) {
                event.attendees[0].email = user.email;
                calendar.freebusy.query(
                  {
                    resource: {
                      timeMin: eventStartTime,
                      timeMax: eventEndTime,
                      timeZone: 'IST',
                      items: [{ id: 'primary' }],
                    },
                  },
                  (err, val) => {
                    // Check for errors in our query and log them if they exist.
                    if (err) console.error('Free Busy Query Error: ', err);
                    else {

                      // Create an array of all events on our calendar during that time.
                      const eventArr = val.data.calendars.primary.busy

                      // Check if event array is empty which means we are not busy

                      // console.log(eventStartTime, "  and ", eventEndTime);
                      // If we are not busy create a new calendar event.
                      calendar.events.insert(
                        { calendarId: 'primary', resource: event },
                        err => {
                          // Check for errors and log them if they exist.
                          if (err) console.log('Error Creating Calender Event:', err)
                          // Else log that the event was created.
                          else {
                            console.log('Calendar event successfully created.');
                            user.addedContests.push(contest.id);
                            user.save();
                          }
                        }
                      )
                    }

                    // If event array is not empty log that we are busy.


                  }
                )
              }
            }
          }
        })
      }
    }

  })

  console.log("Events updated successfully");
}

const deleteAllUsers = function (req, res) {
  User.deleteMany({}, (err, info) => {
    if (err) {
      return res.send({ error: err });
    }
    return res.send({ message: "Deleted All Users", info: info })
  })
}



module.exports = {
  // register,
  clist,
  auth,
  addCalendar,
  deleteAllUsers
}
