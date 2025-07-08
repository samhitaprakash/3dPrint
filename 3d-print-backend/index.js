import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import mongoose from 'mongoose'
import orderRoutes from './routes/orderRoutes.js';


// Load .env variables
dotenv.config()
console.log("✅ Environment loaded.");
console.log("MONGO_URI:", JSON.stringify(process.env.MONGO_URI));


console.log("🔍 MONGO_URI from .env:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err))



// Create the app
const app = express()

// Middlewares
app.use(cors())                // Allow frontend access
app.use(express.json())        // Parse JSON body

// Mount your order routes
app.use('/api/orders', orderRoutes);

// Dummy route to check server is working
app.get('/', (req, res) => {
  res.send('🛠️ Backend is up and running!')
})

// Start server
const PORT = process.env.PORT || 5000

import http from 'http';

const server = http.createServer(app);

server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on https://threed-print-backend.onrender.com`);
});

