My Updated readme
 ffcd59e (MONGODB database done)
# HustleHub+

HustleHub+ is a web-based platform designed to connect people who offer
skills and services with people looking for those services. The project
includes a Node.js and Express backend, a browser-based frontend, secure
user authentication, JWT-based authorization, password hashing, input
validation, and HTTPS support for local development.

## Features

-   User registration
-   User login
-   Password hashing using bcrypt
-   Email and password validation
-   Duplicate email checking
-   JWT authentication
-   Protected user profile/dashboard
-   Logout functionality
-   HTTPS using a self-signed SSL certificate for local development
-   Frontend served directly by the Express server
-   API testing with Postman

## Technologies Used

-   Node.js
-   Express.js
-   JavaScript
-   HTML5
-   CSS3
-   bcryptjs
-   JSON Web Token (JWT)
-   validator
-   OpenSSL
-   Postman

## Project Structure

``` text
HustleHubPlus/
│
├── cert/
│   ├── cert.pem
│   └── key.pem
│
├── public/
│   ├── dashboard.html
│   ├── index.html
│   ├── register.html
│   ├── script.js
│   └── style.css
│
├── node_modules/
├── .gitignore
├── package.json
├── package-lock.json
└── server.js
```

## Requirements

Before running the project, make sure the following are installed:

-   Node.js
-   npm
-   OpenSSL

Check the installations with:

``` bash
node --version
npm --version
openssl version
```

## Installation

### 1. Clone the repository

``` bash
git clone https://github.com/KaraboMatlala/HustleHubPlus.git
```

### 2. Open the project directory

``` bash
cd HustleHubPlus
```

### 3. Install dependencies

``` bash
npm install
```

## HTTPS Certificate Setup

HustleHub+ uses a self-signed certificate for local HTTPS development.

The certificate files are stored in:

``` text
cert/
├── cert.pem
└── key.pem
```

To generate a new certificate using OpenSSL:

``` bash
openssl req -x509 -newkey rsa:2048 -keyout cert/key.pem -out cert/cert.pem -days 365 -nodes
```

When prompted for the Common Name, use:

``` text
localhost
```

### Important

The private key (`key.pem`) must not be uploaded to GitHub. The
certificate directory should be excluded through `.gitignore` when the
certificate is only being used for local development.

## Running the Application

Start the server from the project directory:

``` bash
node server.js
```

The application runs on:

``` text
https://localhost:4000
```

Open the frontend in a browser:

``` text
https://localhost:4000
```

Other available pages include:

``` text
https://localhost:4000/register.html
https://localhost:4000/dashboard.html
```

Because the project uses a self-signed certificate, the browser may
display a certificate warning when accessing the application locally.

## API Endpoints

### Register

**POST**

``` text
https://localhost:4000/api/auth/register
```

Example request:

``` json
{
  "name": "Mahlatsi",
  "email": "mahlatsi@example.com",
  "password": "Password123"
}
```

Successful response:

``` json
{
  "message": "User registered successfully.",
  "user": {
    "id": 1,
    "name": "Mahlatsi",
    "email": "mahlatsi@example.com"
  }
}
```

### Login

**POST**

``` text
https://localhost:4000/api/auth/login
```

Example request:

``` json
{
  "email": "mahlatsi@example.com",
  "password": "Password123"
}
```

Successful login returns a JWT:

``` json
{
  "message": "Login successful.",
  "token": "JWT_TOKEN"
}
```

### Protected Profile

**GET**

``` text
https://localhost:4000/api/profile
```

The endpoint requires a valid JWT.

In Postman, select:

``` text
Authorization → Bearer Token
```

Then paste the JWT returned by the login endpoint into the Token field.

Successful response:

``` json
{
  "message": "You have accessed a protected route.",
  "user": {
    "id": 1,
    "name": "Mahlatsi",
    "email": "mahlatsi@example.com"
  }
}
```

If no token is supplied, the API returns:

``` json
{
  "message": "Access denied. Authentication token is required."
}
```

## Authentication Flow

The authentication process works as follows:

``` text
User Registration
       ↓
Input Validation
       ↓
Password Hashed with bcrypt
       ↓
User Created
       ↓
User Login
       ↓
Password Verified
       ↓
JWT Token Generated
       ↓
Token Stored by Frontend
       ↓
Protected API Request
       ↓
JWT Verified
       ↓
User Profile Returned
```

## Frontend

The frontend is located in the `public` directory.

### `index.html`

Provides the login interface.

### `register.html`

Provides the user registration interface.

### `dashboard.html`

Displays protected user information after successful authentication.

### `script.js`

Handles:

-   Registration requests
-   Login requests
-   JWT storage in `localStorage`
-   Protected profile requests
-   Logout
-   Redirecting unauthenticated users

### `style.css`

Contains the styling for the frontend interface.

## Testing with Postman

The API can be tested using Postman.

Recommended testing sequence:

1.  Register a new user.
2.  Login using the registered email and password.
3.  Copy the JWT returned by the login endpoint.
4.  Send a GET request to `/api/profile`.
5.  Select **Bearer Token** under Authorization.
6.  Paste the JWT into the Token field.
7.  Confirm that the protected profile is returned.
8.  Remove the token and test again.
9.  Confirm that the API returns `401 Unauthorized`.

## Security Features

HustleHub+ includes several security-related controls:

-   Passwords are hashed with bcrypt instead of being stored as plain
    text.
-   Password requirements include a minimum length, an uppercase
    character, and a number.
-   Email addresses are validated before registration.
-   Duplicate email addresses are rejected.
-   JWTs are used to authenticate protected requests.
-   Protected routes reject requests without a valid token.
-   HTTPS is configured for local development.
-   Input validation is performed on registration data.

## Current Development Limitation

The current version uses temporary in-memory user storage:

``` javascript
const users = [];
```

This means registered users are lost when the Node.js server is stopped
or restarted.

For a production-ready version, user data should be stored in a
persistent database and sensitive configuration values such as the JWT
secret should be stored in environment variables rather than being
hard-coded in the source code.

## Troubleshooting

### Port 4000 is already in use

If the server displays:

``` text
EADDRINUSE: address already in use :::4000
```

find the process using port 4000:

``` bash
netstat -ano | grep :4000
```

Then terminate the process using its PID:

``` bash
taskkill //PID <PID> //F
```

Start the server again:

``` bash
node server.js
```

### SSL certificate warning

The project uses a self-signed certificate for local development. A
browser or API client may therefore display an SSL certificate warning.

For local testing only, configure the client to trust/allow the
self-signed certificate.

## Development Notes

This project is intended for development and academic demonstration
purposes. Production deployment should use:

-   A trusted TLS certificate
-   Persistent database storage
-   Environment variables for secrets
-   Additional security middleware and production security configuration
-   Appropriate production hosting and monitoring

## Author

**HustleHub+ Mahlatsi Ramano, Karabo Matlala, Tyrich Reddy**

Repository:

``` text
https://github.com/KaraboMatlala/HustleHubPlus
```

## License

This project is intended for educational and development purposes.
