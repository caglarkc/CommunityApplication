const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const asyncHandler = require('../../../../shared/middlewares/errorHandler/asyncHandler');

/**
 * @swagger
 * tags:
 *   name: User Authentication
 *   description: User registration, authentication, and profile management
 */

/**
 * @swagger
 * /api/v1/user-auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phone
 *               - password
 *               - name
 *               - surname
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               phone:
 *                 type: string
 *                 example: "5551234567"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Passw0rd123"
 *                 description: "En az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir"
 *               name:
 *                 type: string
 *                 example: "Ali"
 *                 description: "En az 3 karakter, en fazla 50 karakter olmalıdır"
 *               surname:
 *                 type: string
 *                 example: "Koçer"
 *                 description: "En az 3 karakter, en fazla 50 karakter olmalıdır"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email or phone already exists
 *       400:
 *         description: Invalid input data
 */
router.post('/register', asyncHandler(authController.register.bind(authController)));


module.exports = router;