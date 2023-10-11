const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()
const cors = require('cors')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Middleware CORS
app.use(cors())

// Routes
const userRoutes = require('./routes/userOptions')
app.use('/', userRoutes)

// Connect to Azure Cosmos DB with MongoDB API
mongoose.connect(process.env.URL_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('[+] Connected to Atlas MongoDB')
  })
  .catch((err) => {
    console.error('[-] Failed to connect to Atlas MongoDB', err)
  })

// Listen on a port
const PORT = process.env.PORT || 10255
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`)
})
