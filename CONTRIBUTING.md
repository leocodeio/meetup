# Contributing to Meetup

Thank you for your interest in contributing to Meetup! This document will help you set up the development environment and contribute effectively.

## 🎯 Quick Start

```bash
# Clone the repository
git clone https://github.com/leocodeio/meetup.git
cd meetup

# Install dependencies
bun install

# Set up MongoDB Replica Set (REQUIRED)
# See "MongoDB Replica Set Setup" below

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start development server
bun run dev
```

Visit `http://localhost:3000` to see your Meetup app!

## 📋 Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| **Bun.js** | Latest | ✅ Yes |
| **MongoDB** | 7.0+ | ✅ Yes (Replica Set) |
| **Node.js** | 18+ | ✅ Via Bun |
| **Git** | Latest | ✅ Yes |

### Installing Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

### Installing MongoDB

**macOS (Homebrew):**
```bash
brew install mongodb/brew/mongodb-community@7.0
brew services start mongodb/brew/mongodb-community@7.0
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

**Windows:**
Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)

## 🗄️ MongoDB Replica Set Setup

⚠️ **CRITICAL**: Prisma with Better Auth requires MongoDB replica set. This is NOT optional.

### Option 1: Start MongoDB with Replica Set (Recommended)

```bash
# Stop any running MongoDB instance
sudo systemctl stop mongod  # Linux
brew services stop mongodb-community  # macOS

# Create data and log directories
mkdir -p ~/mongodb/data ~/mongodb/log

# Start MongoDB with replica set
mongod --replSet rs0 \
  --dbpath ~/mongodb/data \
  --logpath ~/mongodb/log/mongod.log \
  --port 27017 \
  --fork

# Initialize the replica set
mongo --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
```

### Option 2: Use MongoDB Atlas (Cloud)

1. Create free account at [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. Create a free cluster (M0 tier)
3. Create database user with read/write permissions
4. Add your IP to IP access list (0.0.0.0/0 for development)
5. Get connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/meetup?retryWrites=true&w=majority
   ```

### Option 3: Docker (Quickest)

```bash
# Start MongoDB with replica set
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:7.0 \
  --replSet rs0

# Initialize replica set
docker exec mongodb mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
```

### Verify Replica Set

```bash
mongo --eval "rs.status()"
```

Should show `"ok" : 1` and `"stateStr" : "PRIMARY"`

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=mongodb://127.0.0.1:27017/meetup

# Authentication (REQUIRED for sign-in)
BETTER_AUTH_SECRET=your-32-character-secret-key
BETTER_AUTH_GOOGLE_ID=your-google-client-id
BETTER_AUTH_GOOGLE_SECRET=your-google-client-secret
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# AI Transcription
AI_PROVIDER=mistral
AI_MODEL=ministral-3b-2512
MISTRAL_API_KEY=your-mistral-api-key

# Storage (REQUIRED for uploads)
UPLOADTHING_TOKEN=your-uploadthing-token

# Google Cloud Console Setup
# 1. Go to https://console.cloud.google.com/
# 2. Create new project
# 3. Enable Google Meet API
# 4. Create OAuth 2.0 credentials
# 5. Add authorized redirect URIs:
#    - http://localhost:3000/api/auth/callback/google
#    - https://your-domain.com/api/auth/callback/google
```

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Select **External** user type
5. Fill required fields (app name, user support email)
6. Add scopes: `email`, `profile`, `openid`
7. Add test users (your email)
8. Navigate to **Credentials** → **Create Credentials** → **OAuth client ID**
9. Set application type to **Web application**
10. Add authorized redirect URIs:
    ```
    http://localhost:3000/api/auth/callback/google
    ```
11. Copy Client ID and Client Secret to `.env`

## 🚀 Development Workflow

### Starting the Development Server

```bash
# Start MongoDB replica set first (see above)
mongod --replSet rs0 --dbpath ~/mongodb/data --logpath ~/mongodb/log/mongod.log --fork

# Start the Next.js dev server
bun run dev
```

The app will be available at:
- **Local:** http://localhost:3000
- **Network:** http://your-ip:3000

### Ngrok for Public Access (Optional)

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/

# Start tunnel
ngrok http 3000
```

### Database Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes to database
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```

## 🏗️ Project Structure

```
meetup/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── [locale]/          # Localization routes
│   │   │   ├── api/           # API routes
│   │   │   ├── auth/          # Authentication pages
│   │   │   └── dashboard/     # Dashboard pages
│   │   └── api/               # Global API routes
│   ├── components/             # React components
│   │   ├── ui/               # shadcn/ui components
│   │   └── ...               # Custom components
│   ├── lib/                   # Utilities and helpers
│   ├── server/               # Server-side code
│   └── types/                 # TypeScript types
├── prisma/                    # Database schema
├── public/                    # Static assets
├── messages/                  # i18n message files
├── .env                      # Environment variables (create this)
├── package.json
├── bun.lockb
└── README.md
```

## 🎨 Coding Standards

### Code Style

- **TypeScript** for all new code
- **ESLint** for linting
- **Prettier** for formatting
- **Tailwind CSS** for styling

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new meeting recording feature
fix: resolve MongoDB connection timeout
docs: update contributing guide
style: format code with Prettier
refactor: restructure bot service
test: add unit tests for transcription
chore: update dependencies
```

### Branch Naming

```
feature/[feature-name]      # New features
fix/[issue-description]      # Bug fixes
docs/[documentation-topic]  # Documentation updates
```

## 🧪 Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test src/lib/utils.test.ts

# Run with coverage
bun test --coverage
```

## 📦 Building for Production

```bash
# Build the Next.js app
npm run build

# Start production server
npm start
```

## 🐛 Common Issues

### "Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set"

**Solution:** MongoDB is not running as a replica set. Follow the "MongoDB Replica Set Setup" section above.

### "Model does not exist in the database"

**Solution:** Run Prisma commands:
```bash
npx prisma generate
npx prisma db push
```

### "BETTER_AUTH_SECRET should be at least 32 characters"

**Solution:** Generate a secure secret:
```bash
npx @better-auth/cli secret
# or
openssl rand -base64 32
```

### Google OAuth not working in development

**Solution:**
1. Add `localhost` and `127.0.0.1` to authorized JavaScript origins
2. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
3. Add test users in OAuth consent screen

### Port 3000 already in use

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
bun run dev -- -p 3001
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

## 💬 Getting Help

- **GitHub Issues:** Report bugs and request features
- **GitHub Discussions:** Ask questions and share ideas
- **Discord:** [Join our community](https://discord.gg/meetup)

## 📄 License

By contributing to Meetup, you agree that your contributions will be licensed under the [MIT License](LICENSE.md).

---

**Happy coding! 🚀 Made with ❤️ for remote teams**
