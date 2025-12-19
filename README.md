# PlayStation Rental System (PS Rental)

A premium, modular solution for managing PlayStation 5 console rentals via a Telegram Bot and a high-end Next.js Administrative Dashboard.

---

## 🚀 Core Features

### 🎮 Telegram Bot (Client Side)
- **Direct Rental**: Users can browse available consoles and book sessions directly.
- **Dynamic Help**: Fully customizable help system managed from the admin panel.
- **Modular Design**: Re-initializes automatically when the API token is updated.
- **KYC Verification (KUS)**: Multi-step identity verification through the bot.
- **Smart Access Control**: Restricted access for unverified users. Simple, automated menu updates upon verification approval.

### 🛠 Administrative Dashboard (Staff Side)
- **Premium UI**: Dark-mode glassmorphism design with fluid animations (Framer Motion).
- **Console Management**: Real-time control over console status, pricing, and photo management.
- **Live Monitoring**: 
    - Real-time Activity Stream.
    - System Health (Bot, Memory, Storage).
    - Revenue Per Minute (RPM) live tracker.
- **Rental Request Management**: Centralized hub for processing rental requests with sound and badge notifications.
- **KYC Dashboard**: Dedicated interface for reviewing user identity documents and managing verification status.
- **Staff Control (RBAC)**: Comprehensive Role-Based Access Control and multi-admin profiles.

---

## 🏗 Modular Architecture

The system has been refactored into a highly maintainable modular structure:

- `server/`: The backend core.
    - `api/`: Modular Flask blueprints (`consoles`, `stats`, `rentals`, `users`, `history`, `health`, `admins`, `kyc`).
    - `bot/`: Isolated Telegram bot logic, handlers, and keyboards.
    - `core/`: Shared database management and configuration.
    - `data/`: JSON-based persistent storage.
    - `static/`: High-resolution assets and uploaded photos.
- `src/`: The Next.js frontend application.
    - `app/`: Page-based routing for the dashboard.
    - `components/`: Reusable high-end UI components and layouts.

---

## ✅ Completed Milestones & Task History

Below is the full history of tasks and milestones achieved during the development:

- [x] Analyze existing system and templates
- [x] Initialize Next.js project with Tailwind CSS
- [x] Design and implement Core Layout (Glassmorphism, Dark Mode)
- [x] Create initial Flask REST API
- [x] Implement Console Management Page
- [x] Implement Console Photo Upload
- [x] Refactor Backend to Modular Structure
- [x] Create `core` module (config, database)
- [x] Create `api` blueprints (consoles, stats, users, rentals, settings)
- [x] Integrate Telegram Bot as a module
- [x] Implement Unified `app.py` entry point
- [x] Implement Dynamic Help Text from Settings
- [x] Implement Detailed Bot Logging in Console
- [x] Implement Revenue Per Minute (RPM) live metric
- [x] Implement Rental Requests Management
    - [x] Create `api/rentals.py` for requests
    - [x] Create `app/requests/page.js` UI
    - [x] Add sidebar link for Requests
    - [x] Add Sidebar Badges and Sound Notifications
- [x] Integrate Real Data across Admin Panel
    - [x] Implement real Activity Stream on Dashboard
    - [x] Create real Users management page
    - [x] Create real Rental History page
    - [x] Implement real Finance page with transaction logs
    - [x] Implement real System Health monitoring (Bot, Memory, Storage)
    - [x] Implement Quick Start manual rental feature
    - [x] Implement real User Rental details and session history
    - [x] Enhance Console Management with earnings and active session control
    - [x] Implement Multi-Admin Profiles and Role-Based Access Control (RBAC)
    - [x] Implement secure Authentication system and Login page
- [x] Implement KYC (KUS) Verification System
    - [x] Create KYC backend API (kyc.py)
    - [x] Add KYC submission logic to Telegram Bot
    - [x] Create KYC Management page in Admin Panel
- [x] Implement KYC Access Control in Bot
    - [x] Update bot keyboards for dynamic status
    - [x] Add command restrictions in handlers
- [x] Verify everything works in the new structure

---

## 🛠 Setup and Launch

### Prerequisites
- Python 3.x
- Node.js & npm

### Fast Launch
Run the automated startup script from the root directory:
```powershell
./start_project.ps1
```

### Manual Launch
1. **Backend**:
   ```bash
   cd server
   python app.py
   ```
2. **Frontend**:
   ```bash
   npm run dev
   ```

---

## 🔐 Default Credentials
- **Username**: `admin`
- **Password**: `admin`
*(Note: Change your credentials immediately in the "Сотрудники" section for security.)*

---

*Developed with ❤️ as a high-end solution for PlayStation clubs and rental services.*
