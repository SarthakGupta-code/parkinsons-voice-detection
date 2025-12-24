# System Architecture

## Overview

PD-Voice-Detect is a distributed system consisting of three main components:

1. **Mobile Application** (React Native)
2. **Backend API** (Node.js + Express)
3. **ML Service** (Python + Flask)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Application                        │
│                  (React Native + Expo)                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth    │  │ Recording│  │ Results  │  │ Progress │  │
│  │  Screen  │  │  Screen   │  │  Screen  │  │ Tracking │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Offline Storage (SQLite)                      │  │
│  │         Sync Queue                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS/REST API
                        │ JWT Authentication
┌───────────────────────▼─────────────────────────────────────┐
│                    Backend API                               │
│                 (Node.js + Express)                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Auth   │  │ Patients │  │Recording │  │ Analysis │    │
│  │ Service  │  │ Service  │  │ Service  │  │  Queue   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         PostgreSQL Database                            │  │
│  │         Redis (Cache + Queue)                         │  │
│  │         AWS S3 (File Storage)                         │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP API
                        │ Audio File URLs
┌───────────────────────▼─────────────────────────────────────┐
│                    ML Service                                │
│                 (Python + Flask)                             │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Feature  │  │ Ensemble │  │   SHAP   │  │  Model   │    │
│  │Extraction│  │  Model   │  │Explainabi│  │ Training │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Trained Models (TensorFlow/PyTorch)          │  │
│  │         UCI Parkinson's Dataset                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Mobile Application

**Technology Stack:**
- React Native with Expo
- TypeScript
- Redux Toolkit for state management
- React Navigation for routing
- SQLite for offline storage

**Key Features:**
- Multi-role authentication (Patient, Healthcare Worker, Specialist)
- Voice recording with real-time quality feedback
- Offline mode with sync queue
- Multi-language support (13 languages)
- Progress tracking dashboard

**Architecture Patterns:**
- Component-based architecture
- Service layer for API calls
- Custom hooks for reusable logic
- Redux for global state management

### 2. Backend API

**Technology Stack:**
- Node.js + Express.js
- PostgreSQL (Sequelize ORM)
- Redis (Caching & Job Queues)
- AWS S3 (File Storage)
- JWT Authentication

**API Structure:**
```
/api
  /auth          - Authentication endpoints
  /patients      - Patient management
  /recordings    - Audio file upload/management
  /analysis      - Analysis job queue
  /reports       - Report generation
```

**Key Services:**
- Authentication Service (JWT, OAuth)
- Patient Management Service
- Recording Management Service
- Analysis Queue Service (Bull + Redis)
- Report Generation Service (PDF)

### 3. ML Service

**Technology Stack:**
- Python 3.10
- Flask (REST API)
- TensorFlow/PyTorch (Deep Learning)
- Librosa (Audio Processing)
- SHAP (Explainability)

**Processing Pipeline:**
1. Audio Preprocessing (Normalization, Noise Reduction)
2. Feature Extraction (42+ biomarkers)
3. Ensemble Model Prediction
4. SHAP Value Calculation
5. Result Formatting

**ML Models:**
- Random Forest Classifier
- XGBoost Classifier
- Neural Network (Deep Learning)
- Ensemble Voting/Stacking

## Data Flow

### Voice Recording Flow

1. User records voice in mobile app
2. Audio file saved locally (SQLite)
3. File uploaded to AWS S3 via backend
4. Backend creates recording record in PostgreSQL
5. Backend queues analysis job in Redis
6. ML service processes audio file
7. Results stored in PostgreSQL
8. Mobile app fetches results via API
9. Results displayed to user

### Offline Mode Flow

1. User records voice offline
2. Audio stored in local SQLite
3. Sync queue tracks pending uploads
4. When online, background sync uploads files
5. Results fetched and cached locally
6. User can view results offline

## Security Architecture

### Authentication Flow

1. User logs in via mobile app
2. Backend validates credentials
3. JWT access token (15min) + refresh token (7 days) issued
4. Mobile app stores tokens securely (Expo SecureStore)
5. All API requests include JWT in Authorization header
6. Backend validates JWT on each request

### Data Encryption

- **At Rest**: AES-256 encryption for database
- **In Transit**: TLS 1.3 for all API calls
- **Files**: Encrypted in S3 with server-side encryption
- **Tokens**: Stored securely in device keychain

### HIPAA Compliance

- Role-based access control (RBAC)
- Audit logging for all data access
- Data minimization principles
- Right to erasure implementation
- 7-year data retention policy

## Scalability Considerations

### Horizontal Scaling

- **Backend**: Stateless API servers behind load balancer
- **ML Service**: Multiple workers processing jobs from queue
- **Database**: Read replicas for scaling reads
- **Cache**: Redis cluster for distributed caching

### Performance Optimization

- **API Caching**: Redis cache for frequent queries
- **CDN**: CloudFront for static assets
- **Database Indexing**: Optimized indexes on frequently queried columns
- **Batch Processing**: Queue-based async processing for ML jobs

## Deployment Architecture

### Development
- Local development with Docker Compose
- Hot reloading for all services
- Local PostgreSQL and Redis

### Staging
- AWS EC2 instances
- RDS PostgreSQL
- ElastiCache Redis
- S3 buckets

### Production
- AWS ECS Fargate (Container orchestration)
- RDS Multi-AZ (High availability)
- ElastiCache Redis Cluster
- CloudFront CDN
- Auto-scaling groups

## Monitoring & Logging

### Application Monitoring
- **Sentry**: Error tracking
- **DataDog**: Performance monitoring
- **CloudWatch**: AWS resource monitoring

### Logging
- **Winston**: Structured logging in backend
- **Python Logging**: ML service logs
- **CloudWatch Logs**: Centralized log aggregation

## Future Enhancements

1. **Real-time Analysis**: WebSocket for live progress updates
2. **Edge Computing**: On-device ML for faster results
3. **Telemedicine**: Video consultation integration
4. **Wearable Integration**: Apple Watch support
5. **Research Dashboard**: Anonymized analytics

