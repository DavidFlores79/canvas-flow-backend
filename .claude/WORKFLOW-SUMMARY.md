# 🚀 Claude Development Workflow Summary

## Complete Development Workflow Order

### 📋 **Step 1: Feature Planning & Architecture** 

#### Command: `explore-plan <feature-description>`
```bash
# Example:
explore-plan "User authentication with JWT tokens and role-based permissions"
```

**What it does:**
- Analyzes feature requirements and complexity
- **Automatically selects appropriate technology agents:**
  - **Backend needs:** Choose `nestjs-backend-architect` OR `laravel-backend-architect`
  - **Frontend needs:** Choose `angular-frontend-developer` OR `flutter-frontend-developer`
- Creates detailed implementation plan with Clean Architecture
- **Creates session file:** `.claude/sessions/context_session_{feature_name}.md`
- Plans branch naming: `feat/user-authentication`
- References shared `backend-architecture-principles.md`
- **NO ACTIONS TAKEN** - Pure planning phase

**Agents Used:**
- 🎯 **`nestjs-backend-architect`** (if NestJS backend)
- 🎯 **`laravel-backend-architect`** (if Laravel backend)  
- 🎯 **`angular-frontend-developer`** (if Angular frontend)
- 🎯 **`flutter-frontend-developer`** (if Flutter frontend)

**Output:** Session file with detailed implementation plan and technology-specific guidance

---

### 🎯 **Step 2: Branch & Issue Creation**

#### Command: `create-new-gh-branch <feature-description>`
```bash
# Example:
create-new-gh-branch "User authentication with JWT tokens and role-based permissions"
```

**What it does:**
- **Loads session file** from explore-plan with implementation plan
- Creates detailed GitHub issue with technical requirements from session
- **Creates feature branch:** `git checkout -b feat/user-authentication develop`
- Uses information from explore-plan session for consistency
- Includes Definition of Done with >80% test coverage
- Updates session file with branch name for next step

**Agent Used:** None (uses session info from explore-plan)  
**Output:** GitHub issue number, URL, and feature branch created

---

### 🚀 **Step 3: Start Development**

#### Command: `start-working-on-branch-new <branch-name>`
```bash
# Example:
start-working-on-branch-new feat/user-authentication
```

**What it does:**
- Checks out the specified branch (created in previous step)
- **Loads session context** and implementation plan
- **Uses agents selected in explore-plan phase:**
  - **NestJS:** Modules, Controllers, Services, DTOs, Guards, Jest tests
  - **Laravel:** Controllers, Services, Models, Form Requests, PHPUnit tests
  - **Angular:** Components, Services, ReactiveForms, Jasmine tests
  - **Flutter:** Widgets, Bloc patterns, Repository pattern, flutter_test
- Follows Test-Driven Development (TDD)
- Implements according to session plan
- Creates PR targeting develop branch

**Agents Used:**
- 🎯 **Same agents selected in explore-plan phase**
- References `backend-architecture-principles.md` for consistency

**Output:** Feature implemented with >80% test coverage and PR created

---

### 🧪 **Step 4: Comprehensive Testing** (Integrated into feedback loop)

#### Command: `run-tests [scope]` (Called automatically by update-feedback)
```bash
# Run all tests
run-tests

# Run specific test types  
run-tests unit
run-tests integration
run-tests e2e
run-tests coverage
```

**What it does:**
- **Auto-detects project technology:**
  - **NestJS:** `npm test`, `npm run test:cov` (Jest + Supertest)
  - **Laravel:** `php artisan test --coverage` (PHPUnit + Pest)
  - **Angular:** `ng test --code-coverage` (Jasmine + Karma + Cypress)
  - **Flutter:** `flutter test --coverage` (flutter_test + mockito)
- Validates >80% coverage requirement
- Generates consolidated coverage report
- **Integrated into feedback loop** - runs automatically during iterations

**Agent Used:** None (automatic detection)
**Output:** Test results and coverage validation

---

### 📤 **Step 5: Pull Request Creation**

#### Manual GitHub Commands:
```bash
# Push feature branch
git push origin feat/user-authentication

# Create PR targeting develop branch
gh pr create --title "feat: User authentication with JWT tokens" --body "Detailed description" --base develop --reviewer @teammate
```

**What happens:**
- PR automatically targets `develop` branch
- Requires 1 reviewer approval before merge
- CI/CD runs all tests automatically

---

### 🔄 **Step 4: PR Feedback Loop (Iterative Until Approved)**

#### Command: `update-feedback <pr-number>`
```bash
# Example:
update-feedback 45
```

**What it does:**
- **Checks PR status**: Reviews, CI/CD, merge conflicts, approval state
- **If issues found, starts complete cycle:**
  1. Re-runs `explore-plan` with feedback context
  2. Re-runs `start-working-on-branch-new <branch>` to fix issues
  3. Re-runs `run-tests` to validate fixes
  4. Loops back to check PR status again
- **Continues loop until**: ✅ Approved + ✅ CI Green + ✅ No Conflicts
- **Final step**: Merges PR and cleans up branch/issue

**Agents Used:**
- 🎯 **Same technology agents** from original session
- References `backend-architecture-principles.md` for consistency
- **Complete workflow cycle** for each feedback iteration

**Loop until success:** Automatically cycles through entire workflow until PR is merged! 🔄

---

### ✅ **Step 7: Merge & Cleanup**

**Manual Process:**
- Once 1 reviewer approves + all CI checks pass
- Merge PR to `develop` branch
- Delete feature branch
- Mark GitHub issue as completed

---

## 🎯 **Technology Agent Selection Matrix**

| Project Type | Backend Agent | Frontend Agent | 
|--------------|---------------|----------------|
| **NestJS API** | `nestjs-backend-architect` | None |
| **Laravel API** | `laravel-backend-architect` | None |
| **Angular App** | None | `angular-frontend-developer` |
| **Flutter App** | None | `flutter-frontend-developer` |
| **NestJS + Angular** | `nestjs-backend-architect` | `angular-frontend-developer` |
| **Laravel + Angular** | `laravel-backend-architect` | `angular-frontend-developer` |
| **NestJS + Flutter** | `nestjs-backend-architect` | `flutter-frontend-developer` |
| **Laravel + Flutter** | `laravel-backend-architect` | `flutter-frontend-developer` |

## 🔧 **Quick Reference Commands**

### Development Workflow:
```bash
# 1. Create issue
create-new-gh-issue "Feature description"

# 2. Plan implementation  
explore-plan "Feature description"

# 3. Start development
start-working-on-issue-new <issue-number>

# 4. Run tests
run-tests

# 5. Create PR (manual)
gh pr create --base develop --reviewer @teammate

# 6. Handle feedback (if needed)
update-feedback <pr-number>
```

### Testing Commands:
```bash
run-tests           # All tests
run-tests unit      # Unit tests only
run-tests coverage  # Detailed coverage
run-tests e2e       # End-to-end tests
```

### Bug Analysis:
```bash
analyze_bug "Bug description"
```

## 🏗️ **Architecture Consistency**

All agents follow the shared `backend-architecture-principles.md`:
- ✅ Clean Architecture (Domain, Application, Infrastructure, Presentation)
- ✅ SOLID Principles implementation
- ✅ Repository and Service Layer patterns  
- ✅ >80% test coverage requirement
- ✅ Dependency injection patterns
- ✅ API design standards

## 🎯 **Success Criteria**

Each workflow completion ensures:
- ✅ Feature implemented with Clean Architecture
- ✅ >80% test coverage achieved
- ✅ All CI/CD checks passing
- ✅ 1 reviewer approval obtained  
- ✅ Code merged to `develop` branch
- ✅ GitHub issue marked completed

---

## 🚀 **Example Full Workflow**

```bash
# CORRECT workflow order:
# 1. Plan first (creates session file, selects agents)
explore-plan "Product catalog with search and filtering"

# 2. Create issue + branch (uses session info, creates branch)
create-new-gh-branch "Product catalog with search and filtering"

# 3. Start development (works on existing branch, uses session agents)
start-working-on-branch-new feat/product-catalog

# 4. Test thoroughly  
run-tests coverage

# 4. Handle feedback loop (automatically cycles until merged)
update-feedback 46

# This command will:
# - Check PR status (reviews, CI, conflicts)  
# - If issues found: re-run explore-plan → start-working-on-branch → run-tests
# - Loop until: ✅ Approved ✅ CI Green ✅ No Conflicts ✅ Merged

# Result: Professional-grade feature ready for production! 🎉
```