export type IncidentType =
  | 'Fire'
  | 'Medical Emergency'
  | 'Road Accident'
  | 'Crime'
  | 'Flood'
  | 'Building Collapse'
  | 'Gas Leak'
  | 'Earthquake'
  | 'Animal Attack'
  | 'Missing Person'
  | 'Other';

export type UrgencyLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  rawAddress: string;
}

export interface WatermarkedImage {
  id: string;
  originalFile: File;
  previewUrl: string;
  watermarkedDataUrl: string;
  watermarkedBlob: Blob | null;
  filename: string;
  size: number;
  progress: number;
  timestamp: string;
  exifData?: {
    dateTime?: string;
    make?: string;
    model?: string;
  };
}

export interface ReporterInfo {
  fullName: string;
  phoneNumber: string;
  email: string;
  remainAnonymous: boolean;
}

export interface IncidentFormData {
  incidentTitle: string;
  incidentType: IncidentType;
  description: string;
  urgency: UrgencyLevel;
  affectedPeople: number;
  location: LocationData;
  images: WatermarkedImage[];
  reporter: ReporterInfo;
}

export interface PublicIncidentPayload {
  incidentTitle: string;
  incidentType: string;
  description: string;
  urgency: string;
  affectedPeople: number;
  latitude: number | null;
  longitude: number | null;
  address: string;
  images: Array<{
    filename: string;
    watermarkedDataUrl: string;
    timestamp: string;
  }>;
  reporter: {
    fullName: string;
    phoneNumber: string;
    email: string;
    remainAnonymous: boolean;
  };
  createdAt: string;
}

export interface IncidentResponse {
  success: boolean;
  incidentId: string;
  estimatedResponseTimeMinutes: number;
  status: string;
  message: string;
}
