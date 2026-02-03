
# SplitMint 💸

**SplitMint** is a full-stack expense management application built with the **MERN stack** and **Supabase**. It allows users to create groups, track shared expenses, and optimize settlements using a greedy algorithm. This project was developed as part of a technical recruitment task, focusing on **CRUD operations**, **relational database management**, and **optimized UI/UX**.

## 🚀 Features

### **Dashboard & Authentication**

* **Secure Auth**: JWT-based authentication for registration and login.
* **Personalized Experience**: Dashboard greets the user by their **Full Name** and provides a clean overview of all active groups.
* **Auth Guard**: Automatic redirection ensures only logged-in users can access their financial data.

### **Group Management**

* **Dynamic Creation**: Users can create groups (e.g., "Goa Trip 2026") and add up to 3 guest participants.
* **Member Identity**: The creator is automatically added as a participant, labeled as **"Name (You)"** for clear identity tracking.
* **Cascade Deletion**: Owners can delete groups, which triggers a manual cascade to clean up all related expenses and splits in the database.

### **Expense & Settlement Engine**

* **Flexible Splitting**: Supports **Equal**, **Percentage**, and **Custom/Exact** split modes.
* **Transaction Ledger**: A searchable history of all expenses with detailed "click-to-expand" share breakdowns.
* **Greedy Settlement Algorithm**: Automatically calculates the minimum number of transactions required to settle all debts within a group.
* **Settle Up**: Record actual payments between members to balance debts, with an audit trail in the history.

## 🛠️ Tech Stack

* **Frontend**: React.js, React Router, Axios.
* **Backend**: Node.js, Express.js.
* **Database**: Supabase (PostgreSQL).
* **State Management**: React Context API (Auth).
* **Deployment**: Vercel (Frontend), Render (Backend).

## 📂 Project Structure

```text
splitmint/
├── frontend/          # React + Vite application
│   ├── src/
│   │   ├── api/       # Axios configuration (Production ready)
│   │   ├── context/   # Auth state management
│   │   └── pages/     # Dashboard, GroupDetails, etc.
└── backend/           # Node.js + Express API
    ├── routes/        # Auth, Groups, and Expense routes
    └── server.js      # Entry point with CORS and Middleware

```

## ⚙️ Setup & Installation

1. **Clone the repository**:
```bash
git clone https://github.com/govind-sing/splitmint.git

```


2. **Backend Setup**:
* Navigate to `/backend`.
* Create a `.env` file with `SUPABASE_URL`, `SUPABASE_KEY`, and `JWT_SECRET`.
* Run `npm install` then `npm start`.


3. **Frontend Setup**:
* Navigate to `/frontend`.
* Create a `.env` file with `VITE_API_URL=http://localhost:5001/api`.
* Run `npm install` then `npm run dev`.



## 🛡️ Security & Optimization

* **Manual Cascade Deletion**: Implemented to respect relational integrity and prevent orphaned records in PostgreSQL.
* **Lazy Loading**: Split details are fetched on-demand to optimize performance and reduce database load.
* **Environment Protection**: `.gitignore` configured to prevent sensitive `.env` files from being exposed on GitHub.
