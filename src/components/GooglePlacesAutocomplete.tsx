import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string, lat?: string, lng?: string) => void;
  placeholder?: string;
  className?: string;
}

// Declare google type for TypeScript
declare global {
  interface Window {
    google: typeof google;
    initAutocomplete: () => void;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any;

const GooglePlacesAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Enter your city", 
  className 
}: GooglePlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps API
    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    // Initialize Google Places Autocomplete
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['(cities)'],
      componentRestrictions: { country: 'us' }, // Restrict to US
    });

    // Handle place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const cityName = place.formatted_address || place.name || '';
        const lat = place.geometry.location.lat().toString();
        const lng = place.geometry.location.lng().toString();
        
        onChange(cityName, lat, lng);
      } else if (place.name) {
        onChange(place.name);
      }
    });
  }, [isLoaded, onChange]);

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`pl-10 h-12 ${className}`}
      />
    </div>
  );
};

export default GooglePlacesAutocomplete;
