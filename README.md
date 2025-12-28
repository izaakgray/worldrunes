# TFT World Runes Solver

A visual solver for "The World Runes" augment in Teamfight Tactics Set 16. This web application helps players find all valid team compositions that activate 4 unique region traits when given two region emblems.

## Features

- **Visual Team Composition Display**: See your team laid out on a board with unit cards
- **Real-time Solver**: Instantly find all valid combinations as you select emblems
- **Configurable Options**: Adjust board size, minimum/maximum units, and more
- **Region Highlighting**: Color-coded regions make it easy to see which traits are active
- **Emblem Indicators**: Visual indicators show which units have emblems assigned
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository or navigate to the project directory
2. Install dependencies:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your repository in [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and configure the build settings
4. Deploy!

The `vercel.json` file is already configured for optimal deployment.

## How It Works

1. **Select Emblems**: Choose the two region emblems you received from "The World Runes" augment
2. **Configure Options** (optional): Adjust board size and unit count limits
3. **View Results**: The solver automatically finds all valid combinations that activate 4+ unique regions
4. **Analyze Teams**: Each result shows:
   - The units in the composition
   - Which units have emblems assigned
   - All active regions
   - Unit count and region count

## Data Structure

The application uses JSON files for data:
- `data/regions.json`: All available regions with their colors
- `data/units.json`: All units with their region traits and costs

You can easily update these files with the latest Set 16 data.

## Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **CSS Modules**: Scoped styling
- **Vercel**: Hosting platform

## License

MIT

