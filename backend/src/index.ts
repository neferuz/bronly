import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health-check route
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'Bronly Backend'
    });
});

// Mock database or service logic placeholder
app.get('/api/v1', (req: Request, res: Response) => {
    res.json({
        message: 'Welcome to Bronly API version 1.0.0!'
    });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Bronly backend server is running on http://localhost:${port}`);
    console.log(`👉 Health check available at http://localhost:${port}/api/health`);
});
