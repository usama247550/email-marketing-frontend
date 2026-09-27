import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Campaign from '@/models/Campaign';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const campaign = await Campaign.findById(params.id)
      .populate('projectId', 'name slug')
      .lean();

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: campaign });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
