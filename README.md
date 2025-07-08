# 3D Print Order Platform

A full-stack application that allows users to upload 3D models, configure print options, and place custom print orders. Built to demonstrate real-world skills in building full-stack, client-ready platforms.

---

##  Overview

> Frontend: HTML, CSS, JavaScript  
> Backend: Node.js, Express  
> Database: MongoDB Atlas  
> Deployments: Vercel (Frontend), Render (Backend)

---

##  Features

- ✅ Upload STL file names (simulated)
- ✅ Select technology, material, color, finish
- ✅ Dynamic price calculation
- ✅ Custom remarks field
- ✅ Submit order with a click
- ✅ View order history (from database)
- ✅ Clean responsive UI

---

##  Folder Structure

3d-print-platform/
├── 3d-print-frontend/ # HTML, CSS, JS files
│ ├── index.html
│ ├── script.js
│ └── style.css
│
├── 3d-print-backend/ # Node.js + Express backend
│ ├── index.js
│ ├── models/
│ │ └── Order.js
│ ├── routes/
│ │ └── orderRoutes.js
│ └── .env (contains MONGO_URI, not pushed)
│
├── .gitignore
└── README.md 👈 You are here

yaml
Copy code

##  Live Links

- **Frontend:** [https://3d-print-platform.vercel.app](https://3d-print-platform.vercel.app)  
- **Backend API:** [https://threed-print-backend.onrender.com](https://threed-print-backend.onrender.com)

> Note: Render free tier may take ~30s to wake the backend.

---

##  How to Run Locally

### 1. Clone the repo:
```bash
git clone https://github.com/yourusername/3d-print-platform.git
cd 3d-print-platform
