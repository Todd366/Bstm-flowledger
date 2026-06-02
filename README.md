# FlowLedger-Ω Enterprise Edition

**Modern, scalable supply chain custody management system with real-time tracking, AI-powered analytics, and enterprise-grade subscription management.**

## 🚀 Features

### Core Functionality
- ✅ **Photo Capture System** - Real camera integration with image compression
- ✅ **Live Tracking Map** - Real-time dispatch monitoring
- ✅ **Analytics Dashboard** - Performance metrics, KPIs, and transporter scoring
- ✅ **Incident Tracking** - Damage, loss, and mismatch reporting
- ✅ **Multi-Role Access** - Storekeeper, Dispatcher, Driver, Receiver, Manager

### Enterprise Features
- ✅ **Subscription Tiers** - Startup, Professional, Enterprise plans
- ✅ **Error Boundaries** - Graceful error handling
- ✅ **Input Validation** - Security-first data validation
- ✅ **Access Gate** - Email verification system
- ✅ **Error Logging** - Comprehensive debugging tools
- ✅ **Auto-Logout** - Session management
- ✅ **Notification System** - Real-time alerts
- ✅ **PDF Export** - Reports and timelines

## 📋 System Requirements

- **Node.js**: v14.0.0 or higher
- **npm**: v6.0.0 or higher
- **Browser Support**: Chrome, Firefox, Safari, Edge (latest versions)
- **RAM**: Minimum 2GB
- **Disk Space**: Minimum 500MB

## 🛠️ Installation

### Step 1: Clone Repository
```bash
git clone https://github.com/Todd366/Bstm-flowledger.git
cd Bstm-flowledger
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=2.0.0
```

### Step 4: Start Development Server
```bash
npm start
```

Application will open at `http://localhost:3000`

### Step 5: Production Build
```bash
npm run build
```

## 🔐 Access Credentials

### Demo Users (For Testing)
| Role | Name | PIN | Features |
|------|------|-----|----------|
| Storekeeper | John Keeper | 1111 | Create batches, prepare dispatch |
| Dispatcher | Mary Dispatch | 2222 | Approve dispatch, assign transporter |
| Driver | Peter Driver | 3333 | Confirm departure |
| Receiver | Sarah Receiver | 4444 | Complete receipt |
| Manager | Owner Boss | 5555 | Full analytics, reports |

### Admin Access (Email Gate)
- **Email**: bstm366@gmail.com
- **Secret Key**: flowledger-omega-2026-myrah-78355551

## 📁 Project Structure

```
src/
├── App.js                    # Main application component
├── config.js                 # Configuration & subscription tiers
├── index.js                  # React entry point
├── index.css                 # Tailwind styles
├── utils/
│   ├── helpers.js           # Validation, storage, error handling
│   └── auth.js              # Authentication & subscription services
├── components/              # Reusable components (expandable)
└── assets/                  # Images, icons (expandable)

public/
└── index.html              # HTML template

package.json                 # Dependencies & scripts
.env.example                 # Environment template
```

## 🔧 Configuration

### Subscription Tiers

```javascript
// Edit src/config.js

SUBSCRIPTION_TIERS: {
  STARTUP: {
    price: 299,
    users: 5,
    features: ['basic_tracking', 'photo_capture']
  },
  PROFESSIONAL: {
    price: 799,
    users: 25,
    features: ['basic_tracking', 'photo_capture', 'analytics', 'live_map']
  },
  ENTERPRISE: {
    price: 'custom',
    users: 999,
    features: ['all']
  }
}
```

### Feature Flags

```javascript
// src/config.js

FEATURES: {
  ENABLE_DEMO: true,
  ENABLE_ANALYTICS: true,
  ENABLE_PDF_EXPORT: true,
  ENABLE_REAL_CAMERA: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_INCIDENT_TRACKING: true
}
```

## 🎯 Usage Guide

### For Storekeepers
1. Login with PIN: 1111
2. Click "New Intake"
3. Capture supplier document photo
4. Enter product details
5. Capture items photo
6. Submit batch

### For Managers
1. Login with PIN: 5555
2. View Analytics Dashboard
3. Monitor Live Tracking
4. Review Incidents
5. Check Notifications

## 🐛 Debugging

### View Error Logs
```javascript
// In browser console:
localStorage.getItem('flowledger_error_logs')
```

### Clear All Data
```javascript
// In browser console:
localStorage.clear()
window.location.reload()
```

### Enable Debug Mode
```javascript
// In src/utils/helpers.js:
ErrorHandler.log('DEBUG', 'Your message here')
```

## 📊 API Integration Ready

Current version uses localStorage. To connect backend:

1. Update `REACT_APP_API_URL` in `.env`
2. Modify `utils/auth.js` to call API endpoints
3. Replace localStorage calls with API calls
4. Add request/response interceptors

Example API endpoints:
```
POST /api/auth/login
POST /api/batches
GET /api/batches
POST /api/dispatches
POST /api/incidents
```

## 🔒 Security Best Practices

- ✅ Input validation on all forms
- ✅ Error boundary to prevent crashes
- ✅ Secure localStorage (JSON stringification)
- ✅ Session management with auto-logout
- ✅ Email verification gate
- ✅ Role-based access control
- ✅ Data encryption ready (add bcrypt for production)

## 📱 Mobile Optimization

- ✅ Responsive design (mobile-first)
- ✅ Camera optimized for phones
- ✅ Touch-friendly buttons
- ✅ Viewport meta tags configured

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### GitHub Pages
```bash
npm run build
# Update package.json: "homepage": "https://username.github.io/Bstm-flowledger"
# Push build/ to gh-pages branch
```

### Docker
```dockerfile
FROM node:16
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera not working | Check browser permissions, use HTTPS |
| Data not persisting | Check localStorage quota (5-10MB limit) |
| Slow performance | Clear localStorage, disable unnecessary features |
| Login fails | Verify PIN format (4 digits), check browser console |

## 📞 Support & Contact

- **Email**: bstm366@gmail.com
- **Phone**: +267 78 355 551
- **GitHub**: Todd366/Bstm-flowledger

## 📄 License

Proprietary - BSTM Systems © 2024-2026

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 🗺️ Roadmap

- [ ] Backend API (Node.js + PostgreSQL)
- [ ] Real GPS tracking integration
- [ ] Machine learning anomaly detection
- [ ] WhatsApp notifications
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile app (React Native)
- [ ] Advanced reporting
- [ ] Payment gateway integration
- [ ] Two-factor authentication

## 📊 Version History

### v2.0.0 - Enterprise Edition (2026-06-02)
- ✨ Complete rebuild with error boundaries
- ✨ Fixed PhotoCapture component memory leaks
- ✨ Added comprehensive validation system
- ✨ Implemented subscription tier management
- ✨ Added error logging and debugging
- ✨ Improved UI/UX across all views
- 🐛 Fixed localStorage data corruption
- 🐛 Fixed state management issues

### v1.0.0 - Initial Release
- Initial demo version with core features

---

**Last Updated**: June 2, 2026  
**Maintainer**: BSTM Ecosystem
