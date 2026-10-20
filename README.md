# CartShare — Full Stack Collaborative Shopping

CartShare is a full-stack collaborative shopping application for groups that want to share one shopping room, add products to a common cart, see activity updates, and generate a printable receipt.

## Stack

- HTML5
- CSS3
- Bootstrap 5
- Vanilla JavaScript
- Node.js
- Express.js
- MongoDB / MongoDB Atlas
- Mongoose
- Socket.IO

## Features

### User & Rooms
- Create a unique 6-character room
- Join a room with its code
- Track room participants

### Product Catalog
- Product images
- Grocery, Bakery, Snacks, Personal Care, Beverages and Fruits
- Search
- Category filter
- One-click Add button

### Shared Cart
- Persistent database storage
- Quantity controls
- Remove items
- Clear cart
- Product price and line total
- Shows who added each item

### Collaboration
- Socket.IO real-time updates
- Open the same room in two browser windows
- Add/change/remove an item in one window and the other window updates

### Receipt
- Participant list
- Item-level audit information
- Subtotal and group total
- Print-friendly CSS

## Project Structure

```text
CartShare_FullStack/
├── models/
│   └── Room.js
├── public/
│   ├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── login.js
│   │   ├── receipt.js
│   │   └── room.js
│   ├── index.html
│   ├── room.html
│   └── receipt.html
├── .env.example
├── package.json
├── server.js
└── README.md
```

## Run Locally

### 1. Install Node.js

Install Node.js LTS.

### 2. Install dependencies

Open a terminal in this project folder:

```bash
npm install
```

### 3. Create MongoDB database

Create a free MongoDB Atlas cluster.

Create a database user and allow your development IP address.

Copy your MongoDB connection string.

### 4. Create `.env`

Copy `.env.example` to `.env` and set:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
CLIENT_URL=http://localhost:5000
```

### 5. Start

```bash
npm start
```

For development:

```bash
npm run dev
```

Open:

```text
http://localhost:5000
```

## Test Real-Time Collaboration

1. Open CartShare in Chrome.
2. Enter `Archana` and create a room.
3. Copy the room code.
4. Open an Incognito window.
5. Enter another name, for example `Rahul`.
6. Join the same room.
7. Add a product from either window.
8. The shared cart and activity log update through Socket.IO.

## Deployment

The easiest full-stack deployment is a Node-compatible host such as Render.

Set the environment variable:

```text
MONGO_URI
```

and optionally:

```text
CLIENT_URL=https://your-live-domain.example
```

The Express server serves the frontend and Socket.IO from the same application, so you do not need a separate frontend deployment.

## GitHub

```bash
git init
git add .
git commit -m "Build CartShare full stack application"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY
git push -u origin main
```

## Submission Naming

Use the required portal format:

```text
BatchID_FullName_CartShare
```

Example:

```text
B94_ArchanaDicholkar_CartShare
```

## Important

Product images in the demo catalog use remote image URLs. For a fully self-contained submission, replace them with locally downloaded/licensed images inside `public/assets/` and update the product image paths in `public/js/room.js`.
