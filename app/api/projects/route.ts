import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';

export async function GET() {
  try {
    await connectDB();
    const projects = await Project.find({}).sort({ createdAt: 1 }).lean();
    return NextResponse.json({ success: true, data: projects });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
