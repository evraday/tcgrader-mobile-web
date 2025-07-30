# TCGrader Mobile Web App

A cross-platform mobile web application for trading card grading, collection management, and marketplace features.

## Prerequisites

- Node.js 18+ and npm
- A TCGrader account
- Google reCAPTCHA v3 site key (for authentication)

## Environment Setup

### Required Environment Variables

1. **Google reCAPTCHA** (Required for authentication)
   - Go to https://www.google.com/recaptcha/admin
   - Create a new site with reCAPTCHA v3
   - Add your domains:
     - For development: `localhost` and `localhost:3001`
     - For production: your production domain
   - Copy the site key and add to your `.env` file:
   ```
   RECAPTCHA_SITE_KEY=your_site_key_here
   ```

2. **API Configuration** (Optional)
   ```
   API_BASE_URL=https://www.tcgrader.com
   ```

3. **Stripe** (Optional for payments)
   ```
   STRIPE_PUBLIC_KEY=your_stripe_public_key_here
   ```

### Setup Instructions

1. Clone the repository
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Fill in your environment variables in `.env`
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

The app will open at http://localhost:3001

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Tech Stack

- React 18 with TypeScript
- Tailwind CSS v4 for styling
- Zustand for state management
- Capacitor for mobile platform features
- Webpack for bundling

### API Integration

The app connects to the TCGrader API at https://www.tcgrader.com. In development, API requests are proxied through the webpack dev server to avoid CORS issues.

## Building for Mobile

This is a Capacitor-based app that can be built for iOS and Android:

### iOS
```bash
npm run build
npx cap sync ios
npx cap open ios
```

### Android
```bash
npm run build
npx cap sync android
npx cap open android
```

## Troubleshooting

### "Missing captcha" Error
Make sure you have configured your `RECAPTCHA_SITE_KEY` in the `.env` file. The TCGrader API requires reCAPTCHA verification for authentication.

### CORS Issues
The development server is configured to proxy API requests. Make sure you're running on port 3001 (`npm run dev`).

## License

Proprietary - All rights reserved