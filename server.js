const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()
const cors = require('cors')

// Initialize app
const app = express()

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
  res.removeHeader('X-Powered-By')
  next()
})
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
const userRoutes = require('./routes/userOptions')
app.use('/', userRoutes)

// Connect to Azure Cosmos DB with MongoDB API
mongoose.connect(process.env.URL_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('[+] Connected to Atlas MongoDB (Development)')
  })
  .catch((err) => {
    console.error('[-] Failed to connect to Atlas MongoDB (Development)', err)
  })

// Listen on a port
const PORT = process.env.PORT || 10255
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`)
})
