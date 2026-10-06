const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');

dotenv.config();

// Connect to Database
connectDB();

const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// ----------------------------------------
// ROUTES IMPORT & SETUP
// ----------------------------------------
const authRoutes = require('./src/routes/auth.routes');
const catalogRoutes = require('./src/routes/catalog.routes'); // নতুন ইমপোর্ট

app.use('/v1/auth', authRoutes);
app.use('/v1/catalog', catalogRoutes); // নতুন রাউট

// Base Health Route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'TrulyMaple SyncFlow Engine is running locally!',
        environment: process.env.NODE_ENV
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`🔒 CORS allowed for: ${process.env.FRONTEND_URL}`);
    console.log(`=================================`);
});