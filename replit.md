# Soltree - Simple Merkle Tree Creator

## Overview

This is a basic single-page React application for creating Solana Merkle trees. The application provides a clean, minimal interface with just three slider controls for configuring tree parameters, wallet connection, and tree creation. It's built as a 100% frontend application with no backend dependencies.

## System Architecture

Simple single-page application with minimal dependencies:

- **Frontend**: Basic React application with TypeScript
- **UI Components**: Essential Shadcn/ui components (Button, Slider, Card)
- **Wallet Integration**: Solana Wallet Adapter (Phantom & Solflare only)
- **Blockchain**: Direct Solana Web3.js integration
- **Build**: Vite for development and production builds

## Key Features

### Simple Interface
- **3 Sliders**: Canopy Depth, Max Depth, Max Buffer Size
- **Wallet Connection**: Basic wallet adapter for Phantom and Solflare
- **Cost Display**: Real-time cost estimation
- **Create Button**: Direct tree creation on Solana devnet

### Minimal Components
- Single App.tsx file with all functionality
- Essential UI components only (Button, Slider, Card)
- No routing, no complex state management
- No data persistence - session-based only

## Data Flow

1. **User Connection**: Users connect their Solana wallet through the wallet adapter
2. **Parameter Configuration**: Users configure Merkle tree parameters via interactive sliders
3. **Cost Estimation**: Real-time cost estimation based on selected parameters
4. **Tree Creation**: Submits transaction to Solana network via connected wallet
5. **Status Tracking**: Monitors transaction confirmation and updates database
6. **History Management**: Stores created trees for future reference

## External Dependencies

### Blockchain
- **Solana Web3.js**: Core Solana blockchain interaction
- **SPL Account Compression**: Merkle tree creation and management
- **Browser localStorage**: Client-side data persistence
- **Solana Wallet Adapter**: Wallet connection management

### UI/UX
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **React Hook Form**: Form state management
- **TanStack Query**: Server state management

### Development
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the stack
- **Drizzle Kit**: Database schema management
- **ESBuild**: Production bundling

## Deployment Strategy

The application is configured for deployment on Replit with autoscaling capabilities:

- **Build Process**: Vite builds the client, ESBuild bundles the server
- **Production Server**: Serves static files and API from single Express instance
- **Storage**: Client-side localStorage (no database required)
- **Environment**: Node.js 20 with Web and PostgreSQL modules
- **Port Configuration**: Internal port 5000 mapped to external port 80

## Changelog

- June 25, 2025. Initial setup
- June 25, 2025. Updated max depth minimum to 5 for safety (user requirement)
- June 25, 2025. Enhanced wallet connection for preview mode and mobile compatibility
- June 25, 2025. Added custom RPC requirement messaging to prevent access denied errors
- June 25, 2025. Implemented tree configuration save/load system with database storage
- June 25, 2025. Added project archive creation functionality in shared folder
- June 25, 2025. Updated source code download to serve existing ZIP archive from shared folder
- June 25, 2025. Fixed GitHub upload issue by excluding node_modules and providing proper Git setup instructions
- June 25, 2025. Removed database dependencies - converted to client-side localStorage for tree configurations
- June 25, 2025. Created professional landing page with routing: / = landing, /create = app interface
- June 25, 2025. Added static index.html in root for GitHub Pages compatibility
- June 25, 2025. Updated complete project archive with GitHub Pages landing page and latest fixes
- June 25, 2025. Added Git push conflict resolution instructions for initial repository setup
- June 25, 2025. Fixed GitHub Pages deployment structure to serve React app at root level
- June 25, 2025. Updated project archive with GitHub Pages deployment fixes and Git conflict resolution
- June 25, 2025. Fixed deployment workflow to properly handle Vite's dist/public output structure
- June 25, 2025. Updated final project archive with complete GitHub Pages deployment solution
- June 25, 2025. Aligned static HTML landing page design with React component for consistency
- June 25, 2025. Fixed GitHub Pages SPA routing with 404.html redirect and proper file structure
- June 25, 2025. Fixed asset paths in deployment workflow to match Vite build output structure
- June 25, 2025. Added Jekyll config to GitHub Pages deployment to properly serve HTML files
- June 25, 2025. Converted to completely storage-free version - no localStorage, only preset configurations
- June 25, 2025. Created optimized GitHub Pages deployment package with dedicated build configuration
- June 25, 2025. Fixed JavaScript loading errors and asset path conflicts for SolTreez GitHub Pages deployment
- June 25, 2025. Created final deployment package with all fixes applied for complete GitHub Pages compatibility
- June 25, 2025. Added browser extension error suppression to prevent CSS selector parsing conflicts
- June 25, 2025. Converted to 100% frontend application - removed all backend dependencies and server code
- June 26, 2025. Fixed GitHub Pages asset loading errors - enhanced build process to handle Vite's dynamic asset naming
- June 26, 2025. Created complete GitHub Pages deployment solution with working build script and asset path resolution
- June 26, 2025. Simplified landing page design - removed oversized elements and made it super basic as requested
- June 26, 2025. Fixed build script to use npx vite for better Windows compatibility and dependency management
- June 26, 2025. Created complete GitHub Pages build system with automatic dist folder preparation and upload instructions
- June 26, 2025. Fixed GitHub Pages asset loading 404 errors by correcting asset paths to use /SolTreez/ base path and added browser extension conflict prevention
- June 26, 2025. Created complete Netlify deployment configuration with SPA routing and optimized build process
- June 26, 2025. Fixed Netlify build failure by removing server code from build command and using frontend-only configuration
- June 26, 2025. Simplified to basic 1-page version - removed all unnecessary components, pages, routing, and complexity - kept only 3 sliders
- June 26, 2025. Cleaned project structure - removed all deployment folders, build scripts, documentation, and third-party related files to keep only core functionality
- June 26, 2025. Final cleanup - removed all .bat files, .zip archives, generated assets, and version control folders for minimal core-only structure
- June 26, 2025. Updated HTML to load React app directly - no separate landing page, app loads immediately
- June 26, 2025. Removed automatic wallet network detection - now determines network from user-provided RPC endpoint URL for better reliability
- June 26, 2025. Verified Account Compression Program ID - using official Solana Account Compression Program ID (cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK) for proper verification and security
- June 26, 2025. Implemented official Solana depth-size pair validation using ALL_DEPTH_SIZE_PAIRS constant for proper Merkle tree creation compliance
- June 26, 2025. Added comprehensive cost calculation system with calculateCosts() function showing all valid tree combinations, account sizes, and rent costs with proper error handling
- June 26, 2025. Implemented proper Bubblegum tree creation with both concurrent Merkle tree account and tree config PDA account for full Metaplex compatibility
- June 26, 2025. Updated to use official Metaplex Bubblegum SDK with createCreateTreeInstruction and SPL Account Compression package for proper tree creation
- June 26, 2025. Converted sliders to dropdown menus with pre-validated Solana depth-size pairs for automatic compliance with standards
- June 26, 2025. Made custom RPC endpoint mandatory - all buttons and actions now require valid RPC URL to be entered first
- June 26, 2025. Fixed createTreeConfigIx undefined variable error - corrected all variable references for proper Merkle tree creation
- June 26, 2025. Created complete source code archive "source code.zip" in main folder containing entire project without node_modules or build artifacts
- June 26, 2025. Added dynamic download button at top of page that appears when source code.zip is present in the folder
- June 26, 2025. Enhanced wallet compatibility with multiple wallet adapters including Phantom, Solflare, Backpack, Glow, Slope, Torus, and Ledger
- June 26, 2025. Fixed canopy depth validation to only show errors after explicit validation check, not during settings verification
- June 26, 2025. Changed download button to link to GitHub repository instead of ZIP file
- June 26, 2025. Removed canopy depth configuration error warning as requested by user
- June 26, 2025. Updated source code archive with all recent changes including wallet fixes and validation improvements
- June 26, 2025. Created complete project package "soltreez-complete-project.zip" in shared folder with entire codebase
- June 26, 2025. Configured project for Netlify deployment with netlify.toml, separate client package.json, and optimized build process
- June 26, 2025. Updated zip package with complete Netlify deployment configuration and documentation
- June 26, 2025. Created majicdragon.zip package with complete project files for easy deployment

## User Preferences

Preferred communication style: Simple, everyday language.
Max depth minimum: 5 (safety requirement)
Mobile compatibility: Required for preview mode functionality
Wallet adapters: Must work in Replit preview environment
RPC requirement: Custom RPC endpoints required for reliable Merkle tree creation
Data preference: Use on-chain data instead of database for tree discovery
Storage preference: No database - use localStorage for configurations only