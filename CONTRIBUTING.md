# Contributing to Gitsprint

Thank you for your interest in contributing to Gitsprint! This guide will help you set up the development environment and contribute effectively to the project.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Guide](#installation-guide)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Database Management](#database-management)
- [Submitting Contributions](#submitting-contributions)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Bun** (JavaScript runtime and package manager)
- **Node.js 18+** (for compatibility)
- **MongoDB** (local database)
- **Git** (for version control)
- **OpenCode** (recommended for development assistance)

## Installation Guide

### Step 1: Install Bun

Bun is the primary package manager for this project.

#### On Linux/macOS:
```bash
curl -fsSL https://bun.sh/install | bash
```

#### On Windows:
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

#### Verify Installation:
```bash
bun --version
```

### Step 2: Install MongoDB

#### On Linux (Debian/Ubuntu/Kali):
```bash
sudo apt update
sudo apt install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### On macOS:
```bash
brew install mongodb/brew/mongodb-community
brew services start mongodb/brew/mongodb-community
```

#### On Windows:
Download from [mongodb.com](https://www.mongodb.com/try/download/community) and follow the installation wizard.

#### Verify Installation:
```bash
mongosh --version
```

### Step 3: Clone the Repository

```bash
git clone https://github.com/leocodeio/meetup.git
cd meetup
```

### Step 4: Install Dependencies

```bash
bun install
```

This will install all project dependencies and generate the Prisma client.

## Environment Setup

### Step 1: Copy Environment File

```bash
cp .env.example .env
```

### Step 2: Configure Environment Variables

Edit the `.env` file and set the following variables:

```env
# Database
DATABASE_URL="mongodb://localhost:27017/meetup"

# Add other required environment variables as documented in .env.example
```

### Step 3: Verify Database Connection

```bash
bun run prisma:generate
```

This ensures your Prisma client is generated with the correct database schema.

## Running the Application

### Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
bun run build
bun run start
```

### Database Management

#### Generate Prisma Client
```bash
bun run prisma:generate
```

#### Create Database Migration
```bash
bun run prisma:migrate:dev --name <migration-name>
```

#### View Database
```bash
bun run prisma:studio
```

This opens Prisma Studio at `http://localhost:5555`

## Development Workflow

### Using OpenCode

We recommend using OpenCode for enhanced development experience:

1. Install OpenCode CLI
2. Use OpenCode for code generation and assistance
3. Follow OpenCode best practices for consistent coding

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines

3. **Test your changes** thoroughly

4. **Run linting:**
   ```bash
   bun run lint
   ```

5. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: description of changes"
   ```

6. **Push to your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### Database Schema

- Use Prisma schema for all database changes
- Follow naming conventions (camelCase for fields)
- Add proper relations and constraints

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Pages: `kebab-case.tsx`

## Database Management

### Local Development

- Use local MongoDB instance
- Reset database if needed:
  ```bash
  bun run prisma:migrate:reset
  ```

### Production Considerations

- Use MongoDB Atlas or similar for production
- Ensure proper environment variables are set
- Run migrations before deployment

## Testing Guidelines

### Running Tests

```bash
bun run test
```

### Writing Tests

- Write unit tests for utilities
- Integration tests for API endpoints
- E2E tests for critical user flows

## Submitting Contributions

### Pull Request Process

1. **Fork the repository**

2. **Create a feature branch** from `main`

3. **Make your changes** and commit them with clear messages

4. **Push to your fork**

5. **Create a Pull Request:**
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] Linting passes
- [ ] Database migrations included if schema changed
- [ ] Environment variables documented
- [ ] Documentation updated (if needed)

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Getting Help

If you encounter issues:

1. Check existing issues in the repository
2. Review the README.md
3. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Your environment (OS, Bun version, Node version)
   - Error messages

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Gitsprint!
