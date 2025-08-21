# RWE  

**RWE (research with ease) is a desktop app with focus on making deep dive on any topic easier & fast. It is useful focus for people who jumps between topics quicly.**

## Install

Download from github release directly or (website).

## About

> [!NOTE]
> This is v0.2.0. Although, i haven't noticed any, but bugs can be present, please open a issue if you find so.

### Features

- Note with split markdown editor support.
- Local first approach, Fully secure & private.
- AI chat for discussion or help.
- mind map tools with variety of themes.
- white board support. 
- analysis for you habit and data.
- easy data control & export.
- quick sync & update with github release
- quick overview on topic with AI.
- open source with MIT License.

#### Planned 

- advanced whiteboard
- time tracking
- advanced analysis
- custom theme config
- and more!

> Please open a issue if you want some feature :)

## Local Build 

If you wish to build this locally or contribute. follow these steps 

```bash
git clone https://github.com/Tech-with-anmol/RWE
```
```bash
cd RWE
bun install
```

For live preview :

```bash
bun tauri dev 
```

To Build :
```bash
bun tauri build
```
## Project structure

> This structure is ai-generated, because it is so long to write & repeated :)

```
RWE/
├── src/                          # Frontend React/TypeScript code
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── app-sidebar.tsx       # Main sidebar navigation
│   │   ├── mind-map.tsx          # Mind mapping interface
│   │   ├── whiteboard.tsx        # Canvas-based drawing tool
│   │   ├── topic-dialog.tsx      # New topic creation
│   │   ├── search-dialog.tsx     # Search functionality
│   │   ├── api-key-dialog.tsx    # API key management
│   │   ├── command-palette.tsx   # Keyboard shortcuts
│   │   └── ...                   # Other components
│   ├── services/                 # Business logic & API calls
│   │   ├── database.ts           # Tauri database commands
│   │   ├── gemini.ts             # AI integration service
│   │   ├── analytics.ts          # Usage analytics
│   │   ├── cache.ts              # Data caching layer
│   │   └── search.ts             # Search functionality
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utility functions
│   └── App.tsx                   # Main application component
│
├── src-tauri/                    # Backend Rust code
│   ├── src/
│   │   ├── main.rs               # Tauri app entry point
│   │   ├── lib.rs                # Tauri command exports
│   │   ├── database.rs           # SQLite database operations
│   │   ├── search.rs             # Full-text search implementation
│   │   ├── updater.rs            # Auto-update functionality
│   │   └── migrations.rs         # Database schema migrations
│   ├── capabilities/             # Tauri permission configs
│   ├── icons/                    # App icons for different platforms
│   └── tauri.conf.json           # Tauri configuration
│
├── components.json               # shadcn/ui configuration
├── package.json                  # Frontend dependencies
├── vite.config.ts                # Vite build configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── README.md                     # Project documentation
```

### Key Technologies

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Rust, Tauri, SQLite with rusqlite
- **AI Integration**: Google Gemini API
- **Build Tool**: Vite, Bun as package manager
- **UI Components**: Radix UI with custom styling

---

**Contribution or review is highly appreciated. ;)** 




