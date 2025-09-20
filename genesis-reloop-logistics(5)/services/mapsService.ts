import { Loader } from '@googlemaps/js-api-loader';
import { Job, MapMarker } from '../types';

class MapsService {
  private loader: Loader;
  private map: google.maps.Map | null = null;
  private markers: google.maps.Marker[] = [];
  private directionsService: google.maps.DirectionsService | null = null;
  private directionsRenderer: google.maps.DirectionsRenderer | null = null;

  constructor() {
    this.loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });
  }

  // Initialize Google Maps
  async initializeMap(containerId: string, options: google.maps.MapOptions = {}): Promise<google.maps.Map> {
    try {
      await this.loader.load();
      
      const defaultOptions: google.maps.MapOptions = {
        center: { lat: 51.5074, lng: -0.1278 }, // London coordinates
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        ...options
      };

      const mapElement = document.getElementById(containerId);
      if (!mapElement) {
        throw new Error(`Map container with id '${containerId}' not found`);
      }

      this.map = new google.maps.Map(mapElement, defaultOptions);
      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer();
      this.directionsRenderer.setMap(this.map);

      return this.map;
    } catch (error) {
      console.error('Error initializing map:', error);
      throw new Error('Failed to initialize Google Maps');
    }
  }

  // Add markers to map
  addMarkers(markers: MapMarker[]): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    // Clear existing markers
    this.clearMarkers();

    markers.forEach((markerData) => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: this.map,
        title: markerData.title,
        icon: this.getMarkerIcon(markerData.type),
        animation: google.maps.Animation.DROP,
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: this.createInfoWindowContent(markerData),
      });

      marker.addListener('click', () => {
        infoWindow.open(this.map, marker);
      });

      this.markers.push(marker);
    });
  }

  // Clear all markers
  clearMarkers(): void {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
  }

  // Get marker icon based on type
  private getMarkerIcon(type: string): google.maps.Icon | string {
    const baseUrl = 'https://maps.google.com/mapfiles/ms/icons/';
    
    switch (type) {
      case 'job':
        return `${baseUrl}red-dot.png`;
      case 'driver':
        return `${baseUrl}blue-dot.png`;
      case 'supplier':
        return `${baseUrl}green-dot.png`;
      case 'buyer':
        return `${baseUrl}yellow-dot.png`;
      default:
        return `${baseUrl}red-dot.png`;
    }
  }

  // Create info window content
  private createInfoWindowContent(markerData: MapMarker): string {
    const job = markerData.data as Job;
    
    return `
      <div style="padding: 10px; max-width: 300px;">
        <h3 style="margin: 0 0 10px 0; color: #333;">${markerData.title}</h3>
        <p style="margin: 0 0 5px 0; color: #666;">${markerData.description || ''}</p>
        ${job ? `
          <div style="margin-top: 10px;">
            <p style="margin: 0 0 5px 0;"><strong>Volume:</strong> ${job.volume}L</p>
            <p style="margin: 0 0 5px 0;"><strong>Status:</strong> ${job.status}</p>
            <p style="margin: 0 0 5px 0;"><strong>Contamination:</strong> ${job.contamination}</p>
            <p style="margin: 0 0 5px 0;"><strong>Points:</strong> ${job.genesisPointsReward} GP</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Get directions between two points
  async getDirections(
    origin: { lat: number; lng: number } | string,
    destination: { lat: number; lng: number } | string,
    travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING
  ): Promise<google.maps.DirectionsResult | null> {
    if (!this.directionsService) {
      throw new Error('Directions service not initialized');
    }

    try {
      const result = await this.directionsService.route({
        origin,
        destination,
        travelMode,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
      });

      if (this.directionsRenderer) {
        this.directionsRenderer.setDirections(result);
      }

      return result;
    } catch (error) {
      console.error('Error getting directions:', error);
      return null;
    }
  }

  // Clear directions
  clearDirections(): void {
    if (this.directionsRenderer) {
      this.directionsRenderer.setDirections({ routes: [] });
    }
  }

  // Geocode address to coordinates
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address });
      
      if (result.results.length > 0) {
        const location = result.results[0].geometry.location;
        return {
          lat: location.lat(),
          lng: location.lng(),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ 
        location: { lat, lng } 
      });
      
      if (result.results.length > 0) {
        return result.results[0].formatted_address;
      }
      
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  // Calculate distance between two points
  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(point1.lat, point1.lng),
      new google.maps.LatLng(point2.lat, point2.lng)
    );
    
    return distance / 1000; // Convert to kilometers
  }

  // Get current location
  async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting current location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  // Watch user location
  watchLocation(
    onLocationUpdate: (location: { lat: number; lng: number }) => void,
    onError?: (error: GeolocationPositionError) => void
  ): number | null {
    if (!navigator.geolocation) {
      return null;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        onLocationUpdate({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error watching location:', error);
        if (onError) {
          onError(error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // 30 seconds
      }
    );
  }

  // Stop watching location
  stopWatchingLocation(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  }

  // Open Google Maps app with directions
  openInMapsApp(
    destination: { lat: number; lng: number } | string,
    origin?: { lat: number; lng: number } | string
  ): void {
    let url = 'https://www.google.com/maps/dir/';
    
    if (origin) {
      if (typeof origin === 'string') {
        url += encodeURIComponent(origin);
      } else {
        url += `${origin.lat},${origin.lng}`;
      }
      url += '/';
    }
    
    if (typeof destination === 'string') {
      url += encodeURIComponent(destination);
    } else {
      url += `${destination.lat},${destination.lng}`;
    }
    
    window.open(url, '_blank');
  }

  // Get map instance
  getMap(): google.maps.Map | null {
    return this.map;
  }

  // Set map center
  setCenter(lat: number, lng: number, zoom?: number): void {
    if (this.map) {
      this.map.setCenter({ lat, lng });
      if (zoom) {
        this.map.setZoom(zoom);
      }
    }
  }

  // Fit bounds to show all markers
  fitBounds(): void {
    if (this.map && this.markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      this.markers.forEach(marker => {
        const position = marker.getPosition();
        if (position) {
          bounds.extend(position);
        }
      });
      this.map.fitBounds(bounds);
    }
  }
}

// Export singleton instance
export const mapsService = new MapsService();
