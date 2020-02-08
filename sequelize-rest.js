const express = require('express')
const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  "postgres://postgres:secret@localhost:5432/postgres"
);
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 4000

const Movie = sequelize.define("movie", {
  title: Sequelize.STRING,
  yearOfRelease: Sequelize.INTEGER,
  synopsis: Sequelize.STRING
})

sequelize
.sync({force: false})
// .then(() => Movie.truncate())
.then(() => 
  Promise.all([
    Movie.create({
      title: "title",
      yearOfRelease: 2001,
      synopsis: "synopsis"
    }),
    Movie.create({
      title: "title",
      yearOfRelease: 2002,
      synopsis: "synopsis"
    }),
    Movie.create({
      title: "title",
      yearOfRelease: 2003,
      synopsis: "synopsis"
    })
  ])
)
.catch(err => {
  console.error("Unable to create tables, shutting down...", err);
  process.exit(1);
});

app.use(bodyParser.json())

//7.1 create a new movie resource
app.post("/movie", (req, res, next) => {
  // console.log("request body result:", req.body)
  Movie.create(req.body)
    .then(movie => {
      res.send(movie)
    })
    .catch(error => next(error))
})

//7.2 read all movies (the collections resource) and 9. pagination
app.get("/movie", (req, res, next) => {
    const limit = Math.min(req.query.limit || 25, 500)
    const offset = req.query.offset || 0

    Movie.findAndCountAll({limit, offset})
      .then(result => res.send({ movies: result.rows, total: result.count }))
      .catch(error => next(error))
})
 
// 7.3 read a single movie resource (ff not found, send 404 code)
app.get("/movie/:id", async (req, res, next) => {
  try {
    const movieTitle = await Movie.findByPk(req.params.id)
    if(!movieTitle) {
      res.status(404).send("Movie not found!")
    } else {
      res.json(movieTitle)
    }
  } catch(error) {
    next(error)
  }
})

//7.4 update a single movie resource
app.put("/movie/:id", (req, res, next) => {
    Movie
      .findByPk(req.params.id)
      .then(movie => movie.update(req.body))
      .then(movie => res.send(movie))
      .catch(next)
})

//7.5 delete a single movie resource
app.delete("/movie/:id", async (req, res, next) => {
  try {
    const deletedMovie = await Movie.destroy({ where: {id: req.params.id} })
    // console.log(deletedMovie)
    if(deletedMovie === 1) {
      res.status(200).send({message: "Deleted successfully"})
    } else {
      res.status(404).send({message: "Movie not found!"})
    }
  } catch(error) {
    next(error)
  }
})


app.listen(port, () => console.log(`App started in port: ${port}`));
