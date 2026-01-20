# Google Maps Integration Setup

## Overview
MyCricMate uses Google Maps Places API for location selection during onboarding. Users can search for cities in the United States and set their discovery radius in miles.

## Getting a Google Maps API Key

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "MyCricMate")
4. Click "Create"

### Step 2: Enable Required APIs
1. In the Google Cloud Console, navigate to "APIs & Services" → "Library"
2. Search for and enable the following APIs:
   - **Maps JavaScript API**
   - **Places API**

### Step 3: Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key

### Step 4: Restrict the API Key (Recommended)
1. Click on the API key you just created
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your development URL: `http://localhost:5173/*`
   - Add your production URL when deploying: `https://yourdomain.com/*`
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose "Maps JavaScript API" and "Places API"
4. Click "Save"

### Step 5: Add to Your Project
1. Create a `.env` file in the project root (if it doesn't exist)
2. Add your API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```
3. Restart your development server

## Features

### Location Selection
- **US Cities Only**: Autocomplete is restricted to United States cities
- **Precise Coordinates**: Stores latitude and longitude for accurate distance calculations
- **Real-time Search**: As you type, Google Places suggests matching cities

### Distance Measurement
- **Miles**: All distances are measured in miles (not kilometers)
- **Radius Range**: 5-100 miles for discovery radius
- **Default**: 25 miles

## Usage

### Onboarding Page
When users complete onboarding:
1. They search for their city using Google Places Autocomplete
2. Select a city from the dropdown
3. Latitude and longitude are automatically captured
4. Set their discovery radius (5-100 miles)
5. Data is saved to their profile

### Stored Data
The following location data is saved:
- `city`: City name (e.g., "Los Angeles, CA, USA")
- `latitude`: Decimal latitude
- `longitude`: Decimal longitude
- `discovery_radius`: Radius in miles

## API Costs

Google Maps Platform has a generous free tier:
- **Maps JavaScript API**: $200 free credit per month
- **Places API Autocomplete**: First $200/month free
- **Cost per request**: ~$0.017 per autocomplete session

For a small application, you should stay within the free tier.

## Troubleshooting

### API Key Not Working
1. Check that both Maps JavaScript API and Places API are enabled
2. Verify the API key is correctly added to `.env`
3. Restart the development server after adding the key
4. Check browser console for errors

### Autocomplete Not Showing
1. Ensure you have an internet connection
2. Check that the API key has proper restrictions
3. Look for errors in the browser console
4. Verify the script is loading: check Network tab for `maps.googleapis.com`

### "This page can't load Google Maps correctly"
This error usually means:
1. Invalid API key
2. APIs not enabled
3. Billing not set up (required even for free tier)

## Local Development

For local development without an API key, the input field will still work as a regular text input. Users can manually type their city name, but they won't get autocomplete suggestions or automatic latitude/longitude capture.

## Production Deployment

Before deploying to production:
1. Update HTTP referrer restrictions with your production URL
2. Consider adding a daily request limit
3. Set up billing alerts in Google Cloud Console
4. Monitor usage in the Google Cloud Console

## Database Schema

The `users` table includes these location fields:
```sql
city VARCHAR             -- City name
latitude VARCHAR         -- Latitude as string
longitude VARCHAR        -- Longitude as string
discovery_radius INTEGER -- Radius in miles (default: 25)
```

## Converting from Kilometers

If you previously used kilometers:
- 1 km = 0.621371 miles
- 5 km ≈ 3 miles
- 25 km ≈ 16 miles
- 100 km ≈ 62 miles

The system now uses miles throughout for US-based users.
