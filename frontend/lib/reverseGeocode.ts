export interface ReverseGeocodeResult {
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  formattedAddress: string;
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  try {
    // Attempt local backend geocoding endpoint first if running
    const backendRes = await fetch(
      `/api/v1/geocoding/reverse?lat=${lat}&lng=${lng}`,
      { method: 'GET', headers: { Accept: 'application/json' } }
    ).catch(() => null);

    if (backendRes && backendRes.ok) {
      const data = await backendRes.json();
      return {
        street: data.street || data.road || '',
        city: data.city || data.town || data.village || '',
        state: data.state || '',
        country: data.country || '',
        pincode: data.postcode || data.pincode || '',
        formattedAddress: data.address || data.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      };
    }

    // Fallback to OpenStreetMap Nominatim
    const nominatimRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'GuardianLiveEnterprise/1.0',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    );

    if (nominatimRes.ok) {
      const data = await nominatimRes.json();
      const addr = data.address || {};
      const road = addr.road || addr.pedestrian || addr.suburb || '';
      const houseNumber = addr.house_number ? `${addr.house_number} ` : '';
      const street = `${houseNumber}${road}`.trim();
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const state = addr.state || addr.region || '';
      const country = addr.country || '';
      const pincode = addr.postcode || '';

      const formatted =
        data.display_name ||
        [street, city, state, country].filter(Boolean).join(', ');

      return {
        street,
        city,
        state,
        country,
        pincode,
        formattedAddress: formatted,
      };
    }
  } catch (err) {
    console.warn('Reverse geocoding error:', err);
  }

  // Fallback return if fetch fails
  return {
    street: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    formattedAddress: `Coordinates: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
  };
}
