# Meetup - AI-Powered Google Meet Recording & Transcription Bot

<div align="center">

![Meetup - AI Meeting Bot](https://img.shields.io/badge/Meetup-AI%20Meeting%20Bot-blue?style=for-the-badge&logo=googlemeet)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb)
![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun)
![MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Never miss a meeting again.** AI-powered bot that automatically joins Google Meet sessions, records everything, transcribes with speaker labels, and uploads to cloud storage.

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 🎯 What is Meetup?

Meetup is an AI-powered meeting assistant that:

- 🤖 **Auto-Joins Meetings** - Bot automatically joins Google Meet sessions using your credentials
- 🎥 **Records Everything** - Captures high-quality audio and video of every meeting
- 🧠 **Smart Transcription** - AI-powered transcription with speaker diarization
- ☁️ **Cloud Upload** - Automatically uploads recordings to UploadThing
- 📝 **Timestamp Navigation** - Navigate transcripts with precision
- 🔒 **Secure** - Your data is encrypted and stored safely

## ✨ Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Auto-Join Meetings** | Bot joins Google Meet automatically using your credentials |
| **Audio Recording** | Crystal-clear audio capture from all participants |
| **Video Recording** | HD video recording of the entire meeting |
| **Speaker Diarization** | AI identifies and labels each speaker automatically |
| **Transcription** | Convert speech to text using Mistral AI |
| **Cloud Storage** | UploadThing integration for easy file access |
| **Timestamp Search** | Jump directly to any moment in recordings |
| **Multi-Language** | Support for multiple languages |

### Technical Features

- 🔐 **Google OAuth Authentication** - Secure sign-in with Google accounts
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🌍 **i18n Ready** - Internationalization support out of the box
- 🚀 **Fast Performance** - Built with Next.js 15 and Bun runtime
- 🎨 **Beautiful UI** - Modern interface with shadcn/ui components
- 🔌 **API First** - RESTful API for custom integrations

## 🚀 Quick Start

### Prerequisites

- **Bun.js** (latest version)
- **MongoDB** (local or Atlas)
- **Google Cloud Console** project with Meet API enabled
- **Mistral API Key** (for transcription)
- **UploadThing Account** (for storage)

### Installation

```bash
# Clone the repository
git clone https://github.com/leocodeio/meetup.git
cd meetup

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run development server
bun run dev
```

Visit `http://localhost:3000` to see your Meetup app!

### Environment Variables

```env
# Database
DATABASE_URL=mongodb://127.0.0.1:27017/meetup

# Authentication
BETTER_AUTH_SECRET=your-32-character-secret-key
BETTER_AUTH_GOOGLE_ID=your-google-client-id
BETTER_AUTH_GOOGLE_SECRET=your-google-client-secret
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# AI Transcription
AI_PROVIDER=mistral
AI_MODEL=ministral-3b-2512
MISTRAL_API_KEY=your-mistral-api-key

# Storage
UPLOADTHING_TOKEN=your-uploadthing-token

# Google Meet Bot
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

## 📁 Project Structure

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
│   │   ├── validations/      # Zod schemas
│   │   └── utils/            # Helper functions
│   ├── server/               # Server-side code
│   │   ├── services/        # Business logic
│   │   └── utils/           # Server utilities
│   └── types/                 # TypeScript types
├── prisma/                    # Database schema
├── public/                    # Static assets
├── messages/                  # i18n message files
└── scripts/                   # Utility scripts
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐   │
│  │   Landing   │  │   Dashboard │  │   Recordings  │   │
│  │    Page      │  │    Page      │  │      Page      │   │
│  └─────────────┘  └─────────────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │   Auth      │  │   Meetings  │  │   Recordings     │   │
│  │   (Google) │  │   Manager   │  │   API           │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                     ▼
┌─────────────────────┐               ┌─────────────────────┐
│   Bot Service        │               │      MongoDB         │
│   (Puppeteer)       │               │   (Recordings,      │
│   - Joins Meet     │               │    Transcripts)      │
│   - Records Audio  │               └─────────────────────┘
│   - Records Video  │
└─────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI Processing                            │
│  ┌─────────────────┐  ┌─────────────────────────────┐    │
│  │  Speech         │  │      Transcription         │    │
│  │  Diarization   │  │      (Mistral AI)        │    │
│  └─────────────────┘  └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                 Cloud Storage (UploadThing)               │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐   │
│  │   Videos     │  │    Audio    │  │   Transcripts   │   │
│  └─────────────┘  └─────────────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Authentication** | Better Auth (Google OAuth) |
| **Database** | MongoDB, Prisma ORM |
| **Runtime** | Bun.js |
| **AI/ML** | Mistral API (transcription) |
| **Storage** | UploadThing (S3-compatible) |
| **Bot** | Puppeteer (browser automation) |
| **Deployment** | Vercel (frontend), Railway (bot service) |

## 📖 Documentation

- 📘 [Getting Started](docs/getting-started.md)
- 📙 [API Reference](docs/api.md)
- 📗 [Bot Configuration](docs/bot.md)
- 📕 [Deployment Guide](docs/deployment.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful components
- [Mistral AI](https://mistral.ai/) - Transcription API
- [UploadThing](https://uploadthing.com/) - File storage
- [Puppeteer](https://pptr.dev/) - Browser automation

---

<div align="center">

**Built with ❤️ for remote teams everywhere**

[Website](https://meetup.ai) • [GitHub](https://github.com/leocodeio/meetup) • [Twitter](https://twitter.com/meetup_ai)

</div>
