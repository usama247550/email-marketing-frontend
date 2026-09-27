import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Campaign from '@/models/Campaign';
import Project from '@/models/Project';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const projectSlug = searchParams.get('project'); // e.g. "arswift"

    let filter: Record<string, unknown> = {};

    if (projectSlug && projectSlug !== 'all') {
      const project = await Project.findOne({ slug: projectSlug }).lean();
      if (!project) {
        return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
      }
      filter.projectId = project._id;
    }

    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .populate('projectId', 'name slug')
      .lean();

    return NextResponse.json({ success: true, data: campaigns });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
