# Run Comprehensive Test Suite

## Input
Test scope (optional): $ARGUMENTS
- `all` - Run all test types (default)
- `unit` - Run only unit tests
- `integration` - Run only integration tests
- `e2e` - Run only end-to-end tests
- `coverage` - Run tests with detailed coverage report

## Step 1: Detect Project Technology Stack
Automatically detect the technology being used:

### Backend Detection
1. **NestJS Project**: Look for `nest-cli.json`, `@nestjs/core` in package.json
2. **Laravel Project**: Look for `composer.json` with Laravel framework, `artisan` file

### Frontend Detection  
1. **Angular Project**: Look for `angular.json`, `@angular/core` in package.json
2. **Flutter Project**: Look for `pubspec.yaml`, `flutter` SDK dependency

### Mixed Projects
- Detect multiple technologies in monorepo structure
- Run tests for each detected technology stack

## Step 2: Technology-Specific Test Execution

### 🎯 **NestJS Backend Tests**
```bash
# Unit Tests
npm run test

# Integration Tests  
npm run test:e2e

# Coverage Report
npm run test:cov

# Watch Mode (for development)
npm run test:watch
```

**Expected Structure:**
```
src/
├── **/*.spec.ts        # Unit tests
├── **/*.e2e-spec.ts   # E2E tests
└── test/              # Test utilities
```

**Coverage Requirement:** >80%
**Frameworks:** Jest, Supertest

### 🎯 **Laravel Backend Tests**
```bash
# Feature Tests (Integration)
php artisan test --testsuite=Feature

# Unit Tests
php artisan test --testsuite=Unit

# All Tests with Coverage
php artisan test --coverage --min=80

# Parallel Testing (faster)
php artisan test --parallel
```

**Expected Structure:**
```
tests/
├── Feature/           # Integration tests
├── Unit/             # Unit tests
└── TestCase.php      # Base test class
```

**Coverage Requirement:** >80%
**Frameworks:** PHPUnit, Pest (optional)

### 🎯 **Angular Frontend Tests**
```bash
# Unit Tests
ng test --watch=false --browsers=ChromeHeadless

# Coverage Report
ng test --code-coverage --watch=false --browsers=ChromeHeadless

# E2E Tests
ng e2e

# Lint + Test
ng lint && ng test --watch=false --browsers=ChromeHeadless
```

**Expected Structure:**
```
src/
├── app/**/*.spec.ts   # Component/Service tests
├── app/**/*.component.spec.ts
└── e2e/              # E2E tests (Cypress)
```

**Coverage Requirement:** >80%
**Frameworks:** Jasmine, Karma, Angular Testing Library, Cypress

### 🎯 **Flutter Frontend Tests**
```bash
# Unit + Widget Tests
flutter test

# Coverage Report
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html

# Integration Tests
flutter test integration_test/

# Test specific file
flutter test test/features/product/product_bloc_test.dart
```

**Expected Structure:**
```
test/
├── unit/             # Unit tests
├── widget/          # Widget tests
└── integration_test/ # Integration tests
```

**Coverage Requirement:** >80%
**Frameworks:** flutter_test, mockito, bloc_test

## Step 3: Execute Tests by Technology

### Detection and Execution Logic
```bash
# Check for NestJS
if (Test-Path "nest-cli.json") {
    Write-Host "🎯 Detected NestJS project"
    # Run NestJS tests
}

# Check for Laravel
if (Test-Path "artisan") {
    Write-Host "🎯 Detected Laravel project" 
    # Run Laravel tests
}

# Check for Angular
if (Test-Path "angular.json") {
    Write-Host "🎯 Detected Angular project"
    # Run Angular tests
}

# Check for Flutter
if (Test-Path "pubspec.yaml") {
    Write-Host "🎯 Detected Flutter project"
    # Run Flutter tests
}
```

## Step 4: Coverage Validation

### Validate Coverage Requirements
1. **Parse Coverage Reports**: Extract coverage percentage from each technology's output
2. **Validate Threshold**: Ensure >80% coverage for each module
3. **Generate Summary**: Create consolidated coverage report

### Coverage Report Format
```
📊 TEST COVERAGE SUMMARY
========================

🎯 NestJS Backend:
├── Unit Tests:        156 passed, 2 failed
├── Integration Tests: 45 passed
├── Coverage:          87.3% ✅ (>80% required)
└── Duration:          15.2s

🎯 Angular Frontend:  
├── Unit Tests:        89 passed
├── Component Tests:   34 passed
├── Coverage:          91.2% ✅ (>80% required)  
└── Duration:          12.8s

📈 OVERALL RESULT: ✅ PASS
```

## Step 5: Test Result Analysis

### Success Criteria
- [ ] All tests passing
- [ ] Coverage >80% for each technology
- [ ] No linting errors
- [ ] Build successful
- [ ] Performance tests within limits (if applicable)

### Failure Handling
1. **Failed Tests**: List failed test cases with file locations
2. **Low Coverage**: Identify modules below 80% threshold
3. **Lint Errors**: Show specific files needing fixes
4. **Build Issues**: Display compilation errors

### Output Format
```
❌ TEST FAILURES DETECTED

🔍 Failed Tests:
├── src/user/user.service.spec.ts:45 - should validate email format
├── src/auth/auth.controller.spec.ts:12 - should handle invalid credentials
└── test/Feature/UserTest.php:23 - should create user successfully

📉 Coverage Issues:
├── src/payment/payment.service.ts: 72% (needs 8% more)
└── src/notification/email.service.ts: 65% (needs 15% more)

🛠️  Next Steps:
1. Fix failing test cases
2. Add tests for uncovered code paths  
3. Run: run-tests coverage to verify improvements
```

## Step 6: Integration with Workflow

### CI/CD Integration
This command integrates with your development workflow:

1. **Before PR Creation**: Run `run-tests all` to validate before push
2. **During Development**: Use `run-tests unit` for quick feedback
3. **PR Reviews**: Automated coverage reports in PR comments
4. **Release Preparation**: Full test suite with performance validation

### Command Variants
- `run-tests` - Run all tests for detected technologies
- `run-tests unit` - Quick unit test run only
- `run-tests coverage` - Detailed coverage analysis
- `run-tests e2e` - Full integration and e2e testing
- `run-tests watch` - Watch mode for active development

## Quality Standards
- **Speed**: Unit tests complete in <30 seconds
- **Coverage**: Minimum 80% across all modules
- **Reliability**: Tests must be deterministic and stable  
- **Maintainability**: Clear test naming and organization
- **Documentation**: Each test describes expected behavior

## Notes
- **Parallel Execution**: Runs tests for multiple technologies simultaneously when possible
- **Smart Detection**: Automatically adapts to project structure changes
- **Performance Monitoring**: Tracks test execution time trends
- **Integration Ready**: Works with GitHub Actions, GitLab CI, and other CI/CD systems