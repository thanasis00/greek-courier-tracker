import { NextRequest, NextResponse } from 'next/server';

// Courier configurations
const COURIERS = {
  elta: {
    name: 'ELTA Courier',
    apiUrl: 'https://www.elta-courier.gr/track.php',
    patterns: [/^SE\d{9}GR$/, /^EL\d{9}GR$/, /^[A-Z]{2}\d{9}GR$/],
    color: '#1e40af',
  },
  acs: {
    name: 'ACS Courier',
    apiUrl: 'https://api.acscourier.net/api/parcels/search',
    patterns: [/^\d{10}$/],
    color: '#dc2626',
  },
  speedex: {
    name: 'SpeedEx',
    apiUrl: 'http://www.speedex.gr/speedex/NewTrackAndTrace.aspx',
    patterns: [/^SP\d{8,10}$/, /^\d{12}$/, /^\d{9}[A-Z]{2}$/],
    color: '#f59e0b',
  },
  box_now: {
    name: 'Box Now',
    apiUrl: 'https://api-production.boxnow.gr/api/v1/parcels:track',
    patterns: [/^BN\d{8,10}$/],
    color: '#10b981',
  },
  courier_center: {
    name: 'Courier Center',
    apiUrl: 'https://courier.gr/track/result',
    patterns: [/^CC\d{8,10}$/],
    color: '#8b5cf6',
  },
  geniki: {
    name: 'Geniki Taxydromiki',
    apiUrl: 'https://www.taxydromiki.com/track',
    patterns: [/^[A-Z]{2}\d{9,11}$/, /^\d{10,12}$/],
    color: '#ec4899',
  },
};

// Status translations
const STATUS_TRANSLATIONS: Record<string, string> = {
  'Αποστολή παραδόθηκε': 'Delivered',
  'Αποστολή παραδόθηκε σε': 'Delivered to',
  'Αποστολή βρίσκεται σε στάδιο μεταφοράς': 'In Transit',
  'Δημιουργία ΣΥ.ΔΕ.ΤΑ.': 'Shipment Created',
  'Η ΑΠΟΣΤΟΛΗ ΠΑΡΑΔΟΘΗΚΕ': 'Delivered',
  'delivered': 'Delivered',
  'in-depot': 'In Depot',
  'final-destination': 'At Destination',
};

interface TrackingEvent {
  date: string;
  time: string;
  place: string;
  status: string;
}

interface TrackingResult {
  success: boolean;
  trackingNumber: string;
  courier: string;
  courierName: string;
  courierColor: string;
  status: string;
  statusCategory: 'delivered' | 'in_transit' | 'created' | 'unknown' | 'error';
  events: TrackingEvent[];
  latestEvent?: TrackingEvent;
  errorMessage?: string;
}

// Detect courier from tracking number
function detectCourier(trackingNumber: string): string | null {
  const tn = trackingNumber.trim().toUpperCase();
  
  // Check in order of specificity
  for (const [code, courier] of Object.entries(COURIERS)) {
    for (const pattern of courier.patterns) {
      if (pattern.test(tn)) {
        return code;
      }
    }
  }
  return null;
}

// Translate status to English
function translateStatus(status: string): string {
  const statusLower = status.toLowerCase();
  
  for (const [greek, english] of Object.entries(STATUS_TRANSLATIONS)) {
    if (greek.toLowerCase() === statusLower || statusLower.includes(greek.toLowerCase())) {
      return english;
    }
  }
  return status;
}

// Determine status category
function getStatusCategory(status: string): 'delivered' | 'in_transit' | 'created' | 'unknown' {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('delivered') || statusLower.includes('παραδόθηκ')) {
    return 'delivered';
  }
  if (statusLower.includes('transit') || statusLower.includes('μεταφοράς')) {
    return 'in_transit';
  }
  if (statusLower.includes('created') || statusLower.includes('δημιουργία')) {
    return 'created';
  }
  return 'unknown';
}

// Track ELTA shipment
async function trackELTA(trackingNumber: string): Promise<TrackingResult> {
  const courier = COURIERS.elta;
  
  try {
    const response = await fetch(courier.apiUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.elta-courier.gr',
        'Referer': `https://www.elta-courier.gr/search?br=${trackingNumber}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `number=${trackingNumber}&s=0`,
    });

    const text = await response.text();
    // Remove BOM if present
    const cleanText = text.startsWith('\ufeff') ? text.slice(1) : text;
    const data = JSON.parse(cleanText);

    if (data.status === 1) {
      const trackingData = data.result?.[trackingNumber];
      
      if (trackingData?.status === 1) {
        const events: TrackingEvent[] = trackingData.result || [];
        const latestEvent = events[0];
        const translatedStatus = translateStatus(latestEvent?.status || '');
        
        return {
          success: true,
          trackingNumber,
          courier: 'elta',
          courierName: courier.name,
          courierColor: courier.color,
          status: translatedStatus,
          statusCategory: getStatusCategory(translatedStatus),
          events,
          latestEvent,
        };
      }
    }

    return {
      success: true,
      trackingNumber,
      courier: 'elta',
      courierName: courier.name,
      courierColor: courier.color,
      status: 'Not Found',
      statusCategory: 'unknown',
      events: [],
    };
  } catch (error) {
    return {
      success: false,
      trackingNumber,
      courier: 'elta',
      courierName: courier.name,
      courierColor: courier.color,
      status: 'Error',
      statusCategory: 'error',
      events: [],
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Track Box Now shipment
async function trackBoxNow(trackingNumber: string): Promise<TrackingResult> {
  const courier = COURIERS.box_now;
  
  try {
    const response = await fetch(courier.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://boxnow.gr',
      },
      body: JSON.stringify({ parcelId: trackingNumber }),
    });

    const data = await response.json();
    const parcels = data.data || [];

    if (parcels.length > 0) {
      const parcel = parcels[0];
      const events = (parcel.events || []).map((e: any) => ({
        date: e.createTime?.split('T')[0] || '',
        time: e.createTime?.split('T')[1]?.slice(0, 8) || '',
        place: e.locationDisplayName || '',
        status: e.type || '',
      }));
      
      const state = parcel.state || '';
      const translatedStatus = translateStatus(state);
      
      return {
        success: true,
        trackingNumber,
        courier: 'box_now',
        courierName: courier.name,
        courierColor: courier.color,
        status: translatedStatus,
        statusCategory: state === 'delivered' ? 'delivered' : 'in_transit',
        events,
        latestEvent: events[0],
      };
    }

    return {
      success: true,
      trackingNumber,
      courier: 'box_now',
      courierName: courier.name,
      courierColor: courier.color,
      status: 'Not Found',
      statusCategory: 'unknown',
      events: [],
    };
  } catch (error) {
    return {
      success: false,
      trackingNumber,
      courier: 'box_now',
      courierName: courier.name,
      courierColor: courier.color,
      status: 'Error',
      statusCategory: 'error',
      events: [],
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Main tracking function
async function trackShipment(trackingNumber: string): Promise<TrackingResult> {
  const courierCode = detectCourier(trackingNumber);
  
  if (!courierCode) {
    return {
      success: false,
      trackingNumber,
      courier: 'unknown',
      courierName: 'Unknown Courier',
      courierColor: '#6b7280',
      status: 'Error',
      statusCategory: 'error',
      events: [],
      errorMessage: 'Could not detect courier from tracking number format',
    };
  }

  switch (courierCode) {
    case 'elta':
      return trackELTA(trackingNumber);
    case 'box_now':
      return trackBoxNow(trackingNumber);
    // Add more couriers as needed
    default:
      return {
        success: false,
        trackingNumber,
        courier: courierCode,
        courierName: COURIERS[courierCode as keyof typeof COURIERS]?.name || courierCode,
        courierColor: COURIERS[courierCode as keyof typeof COURIERS]?.color || '#6b7280',
        status: 'Not Implemented',
        statusCategory: 'error',
        events: [],
        errorMessage: `Tracking for ${courierCode} is not yet implemented`,
      };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackingNumbers } = body;

    if (!trackingNumbers || !Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one tracking number' },
        { status: 400 }
      );
    }

    const results: TrackingResult[] = [];

    for (const trackingNumber of trackingNumbers) {
      const normalizedNumber = trackingNumber.trim().toUpperCase();

      if (normalizedNumber.length < 8) {
        results.push({
          success: false,
          trackingNumber: normalizedNumber,
          courier: 'unknown',
          courierName: 'Unknown',
          courierColor: '#6b7280',
          status: 'Error',
          statusCategory: 'error',
          events: [],
          errorMessage: 'Invalid tracking number format',
        });
        continue;
      }

      const result = await trackShipment(normalizedNumber);
      results.push(result);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to process tracking request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const trackingNumber = searchParams.get('number');

  if (!trackingNumber) {
    return NextResponse.json(
      { error: 'Please provide a tracking number' },
      { status: 400 }
    );
  }

  const result = await trackShipment(trackingNumber.toUpperCase());
  return NextResponse.json(result);
}
