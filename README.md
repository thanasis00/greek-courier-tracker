# Greek Courier Tracker

A comprehensive tracking solution for Greek courier services. Track packages from multiple Greek courier companies including ACS, ELTA, Speedex, Courier Center, and more through a unified interface.

## � Supported Courier Providers

The application automatically detects the courier based on the tracking number format:

| Courier | Tracking Number Format | Example |
|---------|------------------------|---------|
| **ELTA Courier** | `SE` + 9 digits + `GR` | SE101046219GR |
| **ACS Courier** | 10 digits | 1234567890 |
| **SpeedEx** | `SP` + 8-10 digits or 12 digits or 9 digits + 2 letters | SP12345678 |
| **Box Now** | `BN` + 8-10 digits | BN12345678 |
| **Courier Center** | `CC` + 8-10 digits | CC12345678 |
| **Geniki Taxydromiki** | 2 letters + 9-11 digits or 10-12 digits | GT123456789 |

## 🎯 How to Track Packages

1. **Enter Tracking Number**: Type or paste your tracking number in the input field
2. **Add Multiple Numbers**: Separate multiple tracking numbers with commas or new lines
3. **Auto-Detection**: The system automatically identifies the courier from the format
4. **Track**: Click "Track All Shipments" to get real-time tracking information
5. **View Results**: See status, timeline, and delivery information for each package

## �🚀 Quick Start

### Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application running.

### Production

```bash
# Build for production
bun run build

# Start production server
bun start
```

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
# Build the Docker image
docker build -t greek-courier-tracker .

# Run the container
docker run -p 3000:3000 greek-courier-tracker
```

The application will be available at [http://localhost:3000](http://localhost:3000).
