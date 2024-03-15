const express = require('express')
const crypto = require('node:crypto')
const cors = require('cors')
const { validateMovie, validatePartialMovie } = require('./schemas/movies.js')

const movies = require('./movies.json')
const app = express()
app.use(express.json())
app.use(cors())
app.disable('x-powered-by')

app.get('/', (req, res) => {
  res.json({ message: 'hola mundo' })
})

// métodos simples: GET/HEAD/POST
// Métodos complejos: PUT/PATCH/DELETE

// CORS PRE-flight
// OPTIONS

/* const ACCEPTED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:1234',
  'https://movies.com',
  'https://midu.dev'
] */

// todos los recursos que sean MOVIES se identifica con /movies
app.get('/movies', (req, res) => {
  // Todos los orígenes menos el mismo servidor están permitidos

  const { genre, search } = req.query

  if (genre) {
    const filterByGenre = movies.filter(movie =>
      movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filterByGenre)
  }

  if (search) {
    const filterByName = movies.filter(
      movie =>
        movie.title.toLowerCase() === search.replace(/_/g, ' ').toLowerCase()
    )
    return res.json(filterByName)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => {
  // path-to-regexp
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)
  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }

  // No es rest, porque estamos guardando el estado de la aplicación en memoria
  movies.push(newMovie)
  res.status(201).json(newMovie) // actualizar la cache del cliente
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)
  if (movieIndex === -1) {
    return res.statusCode(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movieIndex[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`server listen on http://localhost:${PORT}`)
})
