import { NextResponse } from 'next/server';

// Default org ID from seeded database (City Fire Dept)
const DEFAULT_ORG_ID = 'fc453021-ac08-4229-bacd-45026d4ff7d6';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      incidentTitle,
      incidentType,
      description,
      urgency,
      affectedPeople,
      latitude,
      longitude,
      address,
      images,
      reporter,
    } = body;

    // Payload validation
    if (!incidentTitle || !description || description.length < 50) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid incident details. Title required and description must be at least 50 characters.',
        },
        { status: 400 }
      );
    }

    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: 'Location coordinates (latitude and longitude) are required.',
        },
        { status: 400 }
      );
    }

    // Forward to Python FastAPI backend
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000/api/v1/incidents/public';

    const backendRes = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: incidentTitle,
        category: incidentType || 'Other',
        priority: urgency || 'Medium',
        description,
        address: address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        latitude: Number(latitude),
        longitude: Number(longitude),
        organization_id: DEFAULT_ORG_ID,
      }),
    });

    if (!backendRes.ok) {
      let errorDetail = 'Backend rejected the incident report.';
      try {
        const errBody = await backendRes.json();
        errorDetail = errBody?.detail || JSON.stringify(errBody) || errorDetail;
      } catch (_) {}
      console.error(`[public incident] Backend returned ${backendRes.status}: ${errorDetail}`);
      return NextResponse.json(
        { success: false, message: `Submission failed: ${errorDetail}` },
        { status: backendRes.status }
      );
    }

    const backendData = await backendRes.json();

    return NextResponse.json({
      success: true,
      incidentId: backendData.id,
      estimatedResponseTimeMinutes: 5 + Math.floor(Math.random() * 5),
      status: 'QUEUED_FOR_DISPATCH',
      message: 'Your incident report has been received by emergency dispatch.',
    });

  } catch (error: any) {
    console.error('[public incident] Error submitting report:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Network error while submitting report. Please check your connection and try again.',
      },
      { status: 500 }
    );
  }
}
