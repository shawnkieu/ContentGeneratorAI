# 🤖 Recruitment AI Chatbot

An intelligent AI-powered chatbot built with Next.js and Claude 4, specialized in generating job descriptions and SEO content for the recruitment industry.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Anthropic Claude](https://img.shields.io/badge/Claude-4.5-purple?style=flat-square)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma)

## ✨ Features

- 🎯 **Specialized AI Agents** - Pre-configured agents for job descriptions and SEO content
- 💬 **Real-time Streaming** - Watch responses generate character-by-character
- 📝 **Markdown Rendering** - Beautiful, formatted output with headers, lists, and emojis
- 🗄️ **Session Management** - Persistent chat history with PostgreSQL
- 🎨 **Modern UI** - Built with shadcn/ui and Tailwind CSS
- 🔧 **Extensible Architecture** - Easy to add new agents and customize prompts
- 🚀 **Prompt Caching** - Optimized API usage with Anthropic's prompt caching
- 📊 **Admin Panel Ready** - Database structure prepared for agent management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. **Clone and install dependencies**

```bash
git clone <your-repo-url>
cd recruitment-ai-chatbot
npm install
```

2. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/recruitment_ai"
ANTHROPIC_API_KEY="sk-ant-your-key-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. **Initialize database**

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with default agents
npx prisma db seed
```

4. **Install shadcn/ui components**

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card textarea scroll-area select label avatar dialog tabs
```

5. **Start development server**

```bash
npm run dev
```

Visit [http://localhost:3000/chat](http://localhost:3000/chat)

## 📖 Usage

### Chat Interface

Navigate to `/chat` and select an agent:

**Job Description Generator**

```
Create a job description for a Senior Software Engineer at TechFlow.
Requirements: 5+ years React, TypeScript, team leadership.
Location: Remote. Salary: $150k-$180k.
```

**SEO Content Creator**

```
Write a blog post about remote software engineering jobs (1000 words).
Target keywords: remote software jobs, work from home developer.
```

### Example Prompts

**Job Descriptions:**

- "Generate a JD for a Marketing Manager at a Series B startup"
- "Create a job posting for a remote Data Scientist, $120k-$150k"
- "Write a job description for a UX Designer in fintech"

**SEO Content:**

- "Write a blog post about tech recruitment trends in 2025"
- "Create a landing page for IT staffing services"
- "Generate SEO content about hiring best practices"

## 🏗️ Architecture

```
recruitment-ai-chatbot/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # Streaming chat endpoint
│   │   ├── agents/route.ts            # Agent management API
│   │   └── sessions/save-message/     # Session persistence
│   ├── chat/page.tsx                  # Main chat interface
│   └── layout.tsx                     # Root layout
├── components/
│   ├── chat/
│   │   ├── chat-interface.tsx         # Chat UI component
│   │   ├── agent-selector.tsx         # Agent dropdown
│   │   └── markdown-content.tsx       # Markdown renderer
│   └── ui/                            # shadcn/ui components
├── hooks/
│   └── use-chat.ts                    # Chat logic hook
├── lib/
│   ├── prisma.ts                      # Prisma client
│   └── tools/
│       └── recruitment-tools.ts       # Tool definitions
├── prisma/
│   ├── schema.prisma                  # Database schema
│   └── seed.ts                        # Seed data
└── scripts/
    └── fix-agents.ts                  # Utility scripts
```

## 🗄️ Database Schema

### Core Models

**Agent** - AI assistants with specialized prompts

```prisma
- id: String (CUID)
- name: String
- type: String (job_description | seo_content)
- systemPrompt: Text
- tools: Json (array of tool IDs)
- config: Json (temperature, max_tokens)
- enabled: Boolean
```

**ChatSession** - Conversation history

```prisma
- id: String (CUID)
- agentId: String
- messages: Json (array of message objects)
- metadata: Json
```

**Tool** - Available tools for agents

```prisma
- id: String
- name: String
- description: String
- schema: Json
- category: String
```

**SystemPrompt** - Versioned prompts

```prisma
- id: String (CUID)
- name: String
- content: Text
- category: String
- version: Int
- isActive: Boolean
```

## 🎨 Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Beautiful UI components
- **Lucide React** - Icon library

### Backend

- **Next.js API Routes** - Serverless functions
- **Anthropic Claude SDK** - AI integration
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Relational database

### AI

- **Claude Sonnet 4.5** - Latest Claude model
- **Streaming Responses** - Real-time generation
- **Prompt Caching** - Cost optimization

## 🔧 Configuration

### Agent Configuration

Agents are configured in `prisma/seed.ts`:

```typescript
{
  name: 'Job Description Generator',
  type: 'job_description',
  systemPrompt: '...',  // Specialized instructions
  tools: [],              // Tool access
  config: {
    temperature: 0.7,     // Response creativity
    max_tokens: 4096,     // Max response length
  }
}
```

### Customizing Prompts

Edit system prompts in `prisma/seed.ts` then run:

```bash
npm run db:seed
```

Or use Prisma Studio:

```bash
npx prisma studio
```

## 📊 API Endpoints

### POST `/api/chat`

Stream chat responses

**Request:**

```json
{
  "messages": [{ "role": "user", "content": "Create a job description..." }],
  "agentId": "job-desc-agent-001",
  "sessionId": "session-123"
}
```

**Response:** Server-Sent Events (SSE)

```
data: {"type":"start"}
data: {"type":"text","content":"# Senior..."}
data: {"type":"done"}
```

### GET `/api/agents`

List available agents

**Response:**

```json
[
  {
    "id": "job-desc-agent-001",
    "name": "Job Description Generator",
    "type": "job_description"
  }
]
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard:

- `DATABASE_URL`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_APP_URL`

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npx prisma studio    # Open database GUI
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes
npx prisma db seed   # Seed database

npm run fix:agents   # Fix agent configuration
```

### Adding New Agents

1. Create system prompt in `prisma/seed.ts`
2. Add agent configuration
3. Run `npx prisma db seed`
4. Agent appears in chat selector

### Adding New Tools

1. Define tool in `lib/tools/recruitment-tools.ts`
2. Add to database via seed or Prisma Studio
3. Enable for specific agents

## 🐛 Troubleshooting

### "No agents available"

```bash
npx prisma db seed
```

### "Authentication error"

Check your `ANTHROPIC_API_KEY` in `.env`

### "Can't reach database"

Verify PostgreSQL is running and `DATABASE_URL` is correct

### "JSON output instead of markdown"

```bash
# Fix agent tools configuration
npx prisma studio
# Set tools to [] for both agents
```

### "Blank responses"

Check terminal logs for errors. Verify agents have `tools: []`

## 📈 Roadmap

- [ ] **Admin Panel** - UI for managing agents, prompts, and tools
- [ ] **Multi-turn Conversations** - Context-aware follow-up questions
- [ ] **Export Functionality** - Download job descriptions as PDF/DOCX
- [ ] **Templates Library** - Pre-built job description templates
- [ ] **Analytics Dashboard** - Track usage and popular queries
- [ ] **Team Collaboration** - Share and collaborate on job postings
- [ ] **API Key Management** - Support multiple Anthropic API keys
- [ ] **Rate Limiting** - Protect against API abuse
- [ ] **MCP Integration** - Connect to external knowledge bases

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude API
- [Vercel](https://vercel.com/) for Next.js
- [shadcn](https://ui.shadcn.com/) for beautiful UI components
- [Prisma](https://www.prisma.io/) for excellent ORM

## 📧 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/recruitment-ai-chatbot/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/recruitment-ai-chatbot/discussions)
- **Email:** your.email@example.com

## 🌟 Star History

If this project helped you, please consider giving it a ⭐️!

---

**Built with ❤️ using Next.js and Claude 4**
