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
 * /api/v1/auth/register:
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

// 🔥 NEW ROUTES
router.post('/login', asyncHandler(authController.login.bind(authController)));
router.post('/check', asyncHandler(authController.checkAuth.bind(authController)));
router.post('/validate', asyncHandler(authController.validateToken.bind(authController)));
router.post('/refresh', asyncHandler(authController.refreshToken.bind(authController)));
router.post('/logout', asyncHandler(authController.logout.bind(authController)));
router.get('/session', asyncHandler(authController.getSessionInfo.bind(authController)));



/**
 * @swagger
 * /api/v1/user-auth/send-verification-email:
 *   post:
 *     summary: Send verification email to user
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *       403:
 *         description: Email already verified
 *       404:
 *         description: User not found
 */
router.post('/send-verification-email', asyncHandler(authController.sendVerificationEmail.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/verify-email:
 *   post:
 *     summary: Verify user's email with verification code
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired verification code
 *       404:
 *         description: User not found
 */
router.post('/verify-email', asyncHandler(authController.verifyEmail.bind(authController)));

module.exports = router;