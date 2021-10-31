const mongoose = require('mongoose');
const axios = require('axios');
const { google } = require('googleapis')
const { OAuth2 } = google.auth
const {OAuth2Client} = require('google-auth-library');



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

        // console.log(payload)
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
  let clist_token = 'username=priyanshu_x&api_key=1e0a1d7b14cf84194ca2a240efc8e735b28b9422'
  let URL_BASE = 'https://clist.by/api/v2/'

  var d = new Date();
  d.setDate(d.getDate() - 2);
 
  console.log(d)
  var c = JSON.stringify(d)
  c = c.substring(1)
  c = c.slice(0, -1)

  console.log(c)

  let url = URL_BASE + 'contest/?limit=200&start__gte=' + c + '&' + clist_token



  // console.log(url)

  axios.get(url)
  .then(r => {
    var ele = r.data.objects;

    ele.forEach(element => {
      console.log(element.id + " " + element.start)
    });
    res.json({ response: r.data.objects });
  })
  .catch(error =>{
    console.log(error);
  })
}

const addCalendar = async function(req,res)
{
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
  var eventStartTime = new Date()
  eventStartTime.setDate(eventStartTime.getDay())

  // Create a new event end date instance for temp uses in our calendar.
  var eventEndTime = new Date()
  eventEndTime.setDate(eventEndTime.getDay())
  eventEndTime.setMinutes(eventEndTime.getMinutes() + 45)

  // Create a dummy event for temp uses in our calendar
  const event = {
    summary: `Meeting with David`,
    location: `3595 California St, San Francisco, CA 94118`,
    description: `Meet with David to talk about the new client project and how to integrate the calendar for booking.`,
    colorId: 1,
    start: {
      dateTime: eventStartTime,
      timeZone: 'IST',
    },
    end: {
      dateTime: eventEndTime,
      timeZone: 'IST',
    },
  }

  calendar.freebusy.query(
    {
      resource: {
        timeMin: eventStartTime,
        timeMax: eventEndTime,
        timeZone: 'IST',
        items: [{ id: 'primary' }],
      },
    },
    (err, res) => {
      // Check for errors in our query and log them if they exist.
      if (err) return console.error('Free Busy Query Error: ', err)
  
      // Create an array of all events on our calendar during that time.
      const eventArr = res.data.calendars.primary.busy
  
      // Check if event array is empty which means we are not busy
      if (eventArr.length === 0)
        // If we are not busy create a new calendar event.
        return calendar.events.insert(
          { calendarId: 'primary', resource: event },
          err => {
            // Check for errors and log them if they exist.
            if (err) return console.error('Error Creating Calender Event:', err)
            // Else log that the event was created.
            return console.log('Calendar event successfully created.')
          }
        )
  
      // If event array is not empty log that we are busy.
  
      return console.log(eventStartTime)
      return console.log(`Sorry I'm busy...`)
    }
  )

}






module.exports = {
    // register,
    clist,
    auth,
    addCalendar
}
