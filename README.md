Project DocApiNexus

Phase 1 - GitHub Repository Foundation
Phase 2 - REST API Foundation
Phase 3 - GraphQL API Foundation
Phase 4 - Authentication Service with JWT and bcrypt
Phase 5 - PostgreSQL Database Integration
Phase 6 - React Web Frontend
Phase 7 - Android App Integration
Phase 8 - Dockerize Services
Phase 9 - Docker Compose Orchestration
Phase 10 - GitHub Actions CI/CD Security Pipeline
Phase 11 - Kubernetes Deployment with Minikube
Phase 12 - Kubernetes Stabilization
Phase 13 - Kubernetes Health Checks
Phase 14 - Kubernetes Security Hardening
Phase 15 - Kubernetes Scanning in CI/CD
Phase 16 - API Gateway
Phase 17 - Microservices Expansion
Phase 18 - Database Migrations
Phase 19 - Observability and Logging
Phase 20 - Advanced CI/CD Security
Phase 21 - Documentation and Architecture Pack



Authentication Serivice

In my Auth Service, during registration the password travels from client to server over HTTPS. The server never stores the plain password. It uses bcrypt to generate a salted one-way hash and stores only that hash. During login, the submitted password is compared with the stored bcrypt hash using bcrypt.compare. If the comparison succeeds, the service generates a JWT containing user claims like subject, username, and role. The client then sends this JWT in the Authorization Bearer header to access protected REST, GraphQL, or microservice endpoints.