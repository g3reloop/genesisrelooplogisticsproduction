<div align="center">
<img width="1200" height="475" alt="Genesis Reloop Logistics" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Genesis Reloop Logistics

A comprehensive circular economy platform for Used Cooking Oil (UCO) that connects restaurants with collectors and biofuel plants. Built with React, TypeScript, Supabase, and blockchain technology.

## 🌟 Features

### Core Platform
- **Multi-role User System**: Suppliers, Drivers, Buyers, and Admins
- **Real-time Job Management**: Live job tracking and assignment
- **Blockchain Integration**: Digital Waste Transfer Notes (DWTN) on Polygon
- **Genesis Points System**: Merit-based reward and profit-sharing system
- **Payment Processing**: Stripe integration for secure transactions
- **Maps Integration**: Google Maps for location services and navigation

### Chain of Custody & Compliance
- **ISCC-Compliant DWTN NFTs**: Immutable blockchain records for UCO batches
- **QR Code Verification**: Public verification dashboard for stakeholders
- **Real-time Tracking**: GPS coordinates and timestamps at collection/delivery
- **Processor Verification**: Blockchain-confirmed delivery and verification
- **Audit Trail**: Complete chain of custody from restaurant to processor

### AI-Powered Services
- **LLM Job Matching**: Intelligent driver-job matching using OpenRouter API
- **Route Optimization**: AI-powered route planning and optimization
- **Customer Support**: AI assistant for user guidance and support
- **Fraud Detection**: AI-powered transaction monitoring and risk assessment
- **Mass Balance Analytics**: AI insights for processing efficiency

### Additional Services
- **ISCC Compliance Verification**: Automated compliance checking (£150/month)
- **Mass Balance Monitoring**: Real-time tracking and analytics (£100/month)
- **Fraud Prevention System**: AI-powered fraud detection (£200/month)
- **Automated Documentation**: Compliance document generation (£300/month)

### Advanced Features
- **Progressive Web App (PWA)**: Offline functionality and mobile app-like experience
- **Real-time Notifications**: Push notifications and email alerts
- **File Upload System**: Document verification and management
- **Analytics Dashboard**: Comprehensive reporting and insights
- **Multi-language Support**: Internationalization ready
- **Accessibility**: WCAG 2.1 compliant

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Supabase account
- Google Maps API key
- Stripe account
- OpenRouter API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/genesis-reloop-logistics.git
   cd genesis-reloop-logistics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Set up Supabase database**
   ```bash
   # Run the schema.sql file in your Supabase SQL editor
   cat supabase/schema.sql
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Architecture

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Zustand** for state management
- **React Query** for data fetching
- **Framer Motion** for animations
- **Tailwind CSS** for styling

### Backend
- **Supabase** for database and authentication
- **PostgreSQL** with PostGIS for geospatial data
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates

### Blockchain
- **Polygon Network** for DWTN creation
- **Ethers.js** for blockchain interactions
- **Smart contracts** for immutable records

### Infrastructure
- **Netlify** for hosting and deployment
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **Nginx** for reverse proxy

## 📁 Project Structure

```
genesis-reloop-logistics/
├── components/          # Reusable UI components
│   ├── common/         # Shared components
│   ├── driver/         # Driver-specific components
│   └── supplier/       # Supplier-specific components
├── pages/              # Route components
├── services/           # API and business logic
├── lib/                # Utilities and configurations
├── types/              # TypeScript type definitions
├── supabase/           # Database schema and migrations
├── public/             # Static assets
├── src/test/           # Test files
└── docs/               # Documentation
```

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# Test with coverage
npm run test:coverage

# Test UI
npm run test:ui

# E2E tests
npm run test:e2e
```

### Test Coverage
- Unit tests with Vitest
- Integration tests with React Testing Library
- E2E tests with Cypress
- Accessibility tests with axe-core

## 🚀 Deployment

### Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
# Build image
docker build -t genesis-reloop .

# Run container
docker run -p 3000:3000 genesis-reloop
```

### Manual Deployment
```bash
# Build for production
npm run build

# Preview build
npm run preview

# Deploy dist/ folder to your hosting provider
```

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `VITE_OPENROUTER_API_KEY` | OpenRouter API key | Yes |

### Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql`
3. Enable Row Level Security policies
4. Set up storage buckets for file uploads

## 📊 Monitoring & Analytics

### Built-in Monitoring
- Error tracking with Sentry integration
- Performance monitoring
- User analytics
- Real-time metrics

### Logging
- Structured logging with Winston
- Request/response logging
- Error logging and alerting
- Audit trail for compliance

## 🔒 Security

### Security Features
- JWT-based authentication
- Row Level Security (RLS)
- Input validation and sanitization
- CSRF protection
- XSS prevention
- SQL injection prevention
- Rate limiting
- Content Security Policy (CSP)

### Compliance
- GDPR compliant
- Data encryption at rest and in transit
- Audit logging
- Privacy controls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Follow the existing code style
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Component Library](docs/components.md)
- [Deployment Guide](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)

### Community
- [GitHub Discussions](https://github.com/yourusername/genesis-reloop-logistics/discussions)
- [Discord Server](https://discord.gg/genesis-reloop)
- [Email Support](mailto:support@genesisreloop.com)

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Core platform functionality
- [x] User authentication and authorization
- [x] Job management system
- [x] Basic payment processing
- [x] Maps integration

### Phase 2 (Q2 2024)
- [ ] Mobile applications (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Machine learning for job matching
- [ ] Multi-language support
- [ ] Advanced reporting

### Phase 3 (Q3 2024)
- [ ] IoT integration for smart containers
- [ ] Advanced blockchain features
- [ ] API marketplace
- [ ] Third-party integrations
- [ ] Enterprise features

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- Maps by [Google Maps](https://developers.google.com/maps)
- Payments by [Stripe](https://stripe.com/)
- Blockchain by [Polygon](https://polygon.technology/)
- Hosted on [Netlify](https://netlify.com/)

---

<div align="center">
  <p>Made with ❤️ by the Genesis Reloop team</p>
  <p>
    <a href="https://genesisreloop.com">Website</a> •
    <a href="https://docs.genesisreloop.com">Documentation</a> •
    <a href="https://github.com/yourusername/genesis-reloop-logistics/issues">Issues</a>
  </p>
</div>
