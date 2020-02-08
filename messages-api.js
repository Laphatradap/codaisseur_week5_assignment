const express = require('express')
const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  "postgres://postgres:secret@localhost:5432/postgres"
);
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 3000

const Message = sequelize.define("message", {
  message: Sequelize.STRING
})

sequelize
  .sync({force: false })
  .then(() => console.log("Tables created successfully"))
  .catch(err => {
    console.error("Unable to create tables, shutting down...", err);
    process.exit(1);
  });

app.use(bodyParser.json())

app.get("/messages", async (req, res, next) => {
  try {
    const messages = await Message.findAll()
    res.send(messages)
  } catch (error) {
    next (error)
  }
})

async function isAllowedMiddleware(req) {
  // Get last 5 messages from DB
  const lastFive = await Message.findAll({
    attributes: ['message'],
    order: [['id', 'DESC']],
    limit: 5
  }).map(msg => msg.dataValues.message)
  // Check if they are all the same as the current one
  const isSixthRequest = lastFive
    .map(prevMessage => prevMessage === req.body.message)
    .reduce((total, current) => total && current, true)
  // true to allow DB write, false if this is the 6th repeated request
  return !isSixthRequest
}

app.post("/messages", async (req, res, next) => {  
  //console.log(req)
  try {
    if(('message' in req.body) && (req.body.message !== '')){
      // console.log(isAllowedMiddleware(req))
      if(await isAllowedMiddleware(req)) {
        const message = await Message.create(req.body)
          res.json(message)
      } else {
        res.status(429).send("Too many requests")
      }
    } else {
      res.status(400).send("the body does NOT have a message property or the string is empty")
    }
  } catch(error) {
    next(error)
  }
})

app.listen(port, () => console.log(`App started in port: ${port}`));
