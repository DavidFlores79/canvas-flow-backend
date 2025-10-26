# Backend Architecture Principles

## Shared Architectural Guidelines

This document defines the common architectural principles that ALL backend agents should follow, regardless of framework (NestJS, Laravel, etc.).

## 🏗️ Clean Architecture Layers

### 1. Domain Layer (Core Business Logic)
- **Entities**: Core business objects with identity
- **Value Objects**: Immutable objects that describe aspects of the domain  
- **Domain Services**: Business logic that doesn't belong to a specific entity
- **Repository Interfaces**: Abstract data access contracts
- **Domain Events**: Business events that trigger side effects

### 2. Application Layer (Use Cases)
- **Use Cases/Services**: Orchestrate business workflows
- **Application Services**: Coordinate between domain and infrastructure
- **DTOs/Requests**: Data transfer objects for input/output
- **Command/Query Handlers**: CQRS pattern implementation
- **Validation Rules**: Input validation and business rules

### 3. Infrastructure Layer (External Concerns)  
- **Repository Implementations**: Concrete data access implementations
- **External API Clients**: Third-party service integrations
- **Database Configurations**: ORM setup and migrations
- **File Storage**: Cloud storage, local filesystem
- **Message Queues**: Event publishing and consumption

### 4. Presentation Layer (Interface)
- **Controllers/Handlers**: HTTP request handling
- **Middleware/Guards**: Cross-cutting concerns (auth, logging, cors)
- **Exception Handling**: Error responses and logging
- **API Documentation**: OpenAPI/Swagger specifications
- **Response Formatting**: Consistent API response structure

## 🎯 SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- Controllers only handle HTTP concerns
- Services contain specific business logic
- Repositories only handle data access
- Each class has one reason to change

### Open/Closed Principle (OCP)  
- Use interfaces for dependencies
- Extend behavior through composition
- Plugin architecture for features
- Strategy pattern for algorithms

### Liskov Substitution Principle (LSP)
- Interface implementations are interchangeable
- Repository implementations follow contracts
- Service implementations honor interfaces
- No behavioral surprises in substitutions

### Interface Segregation Principle (ISP)
- Small, focused interfaces
- Clients depend only on methods they use
- Role-based interface design
- Avoid monolithic interfaces

### Dependency Inversion Principle (DIP)
- Depend on abstractions, not concretions
- Inject dependencies through constructor
- Use dependency injection containers
- High-level modules don't depend on low-level modules

## 🧪 Testing Standards

### Coverage Requirements
- **Minimum 80% code coverage** across all layers
- **100% coverage** for critical business logic
- **Integration tests** for complete user workflows  
- **Unit tests** for individual components

### Testing Pyramid
- **Unit Tests** (70%): Fast, isolated, focused
- **Integration Tests** (20%): Component interactions
- **E2E Tests** (10%): Complete user scenarios

### Test Organization
- Test files adjacent to source files
- Clear test naming conventions
- Arrange-Act-Assert pattern
- Mock external dependencies

## 🔒 Security Standards

### Authentication & Authorization
- JWT or session-based authentication
- Role-based access control (RBAC)
- API rate limiting and throttling
- Input validation and sanitization

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement CORS policies
- Sanitize all user inputs

## 📊 API Design Standards

### RESTful Conventions
- Use standard HTTP verbs (GET, POST, PUT, DELETE)
- Consistent URL structure (/api/v1/resources)
- HTTP status codes for responses
- Pagination for list endpoints

### Response Format
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "meta": {
    "timestamp": "2025-10-26T12:00:00Z",
    "version": "1.0"
  }
}
```

### Error Handling
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR", 
    "message": "Invalid input provided",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-26T12:00:00Z",
    "trace_id": "abc123"
  }
}
```

## 🚀 Performance Standards

### Database Optimization
- Use database indexes appropriately
- Implement query optimization
- Use connection pooling
- Cache frequently accessed data

### Scalability Considerations
- Stateless application design
- Horizontal scaling capability
- Async processing for long operations
- Load balancing support

## 📝 Code Quality Standards

### Code Style
- Consistent formatting and naming
- Meaningful variable and function names
- Comment complex business logic
- Follow language-specific conventions

### Documentation Requirements
- API documentation (OpenAPI/Swagger)
- README with setup instructions  
- Code comments for business logic
- Architecture decision records (ADRs)

## 🔄 DevOps Integration

### CI/CD Requirements
- Automated testing on every commit
- Code quality gates (linting, coverage)
- Automated deployment pipelines
- Database migration automation

### Monitoring & Observability  
- Application logging (structured logs)
- Performance monitoring (APM)
- Error tracking and alerting
- Health check endpoints

---

## Framework Implementation

Each framework-specific agent (NestJS, Laravel, etc.) should implement these principles using their respective tools, patterns, and conventions while maintaining consistency in architectural approach.