# Logistics CRM Application

A fullstack logistics CRM application for transportation agencies managing cargo between Johannesburg (South Africa) and cities in the Democratic Republic of Congo (Lubumbashi and Kinshasa).

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI Components**: ShadCN UI, TailwindCSS
- **Backend**: Next.js Server Actions, Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Maps**: Leaflet with React-Leaflet
- **Validation**: Zod
- **Image Processing**: Sharp

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase project details:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
├── app/                    # Next.js App Router pages and layouts
│   ├── actions/           # Server Actions for data mutations
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ui/               # ShadCN UI components
├── lib/                   # Utility functions and configurations
│   └── utils.ts          # Utility functions
├── .kiro/                # Kiro spec files
│   └── specs/
│       └── logistics-crm-application/
└── public/               # Static assets
```

## Features

- Multi-role authentication (Admin, Operator, Driver)
- Client and receiver management
- Shipment tracking with unique tracking numbers
- Trip planning and management
- Real-time driver location tracking
- Mobile-responsive driver interface
- Delivery proof capture with photo uploads
- Revenue and payment tracking
- Dashboard analytics

## Development

This project uses:
- TypeScript for type safety
- ESLint for code linting
- TailwindCSS for styling
- ShadCN UI for component library

## License

Private - All rights reserved
