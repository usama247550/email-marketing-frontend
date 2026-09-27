import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import Campaign from '@/models/Campaign';

const SEED_PROJECTS = [
  { name: 'Arswift', slug: 'arswift' },
  { name: 'Goldsilver.de', slug: 'goldsilver' },
  { name: 'Cellulite-Anticellulite', slug: 'anticellulite' },
];

export async function POST() {
  try {
    await connectDB();

    // Upsert projects
    const projects: Record<string, string> = {};
    for (const p of SEED_PROJECTS) {
      const doc = await Project.findOneAndUpdate(
        { slug: p.slug },
        { $setOnInsert: p },
        { upsert: true, new: true }
      );
      projects[p.slug] = doc._id.toString();
    }

    // Seed campaigns per project (idempotent by name + projectId)
    const seedCampaigns = [
      // Arswift
      { name: 'Frankfurt Wellness', slug: 'arswift', leadsCount: 200, sentCount: 185, openedCount: 92, repliedCount: 14, failedCount: 4, status: 'Running' },
      { name: 'Hamburg Spa Retreat', slug: 'arswift', leadsCount: 180, sentCount: 0, openedCount: 0, repliedCount: 0, failedCount: 0, status: 'Draft' },
      { name: 'Arswift Q3 Outreach', slug: 'arswift', leadsCount: 310, sentCount: 310, openedCount: 148, repliedCount: 22, failedCount: 8, status: 'Completed' },
      // Goldsilver
      { name: 'Berlin Beauty Centers', slug: 'goldsilver', leadsCount: 150, sentCount: 150, openedCount: 74, repliedCount: 18, failedCount: 3, status: 'Completed' },
      { name: 'Cologne Wellness Hub', slug: 'goldsilver', leadsCount: 220, sentCount: 198, openedCount: 105, repliedCount: 19, failedCount: 6, status: 'Running' },
      { name: 'Gold & Silver Promo', slug: 'goldsilver', leadsCount: 95, sentCount: 0, openedCount: 0, repliedCount: 0, failedCount: 0, status: 'Draft' },
      // Anticellulite
      { name: 'Munich Fitness Studios', slug: 'anticellulite', leadsCount: 100, sentCount: 100, openedCount: 42, repliedCount: 9, failedCount: 2, status: 'Completed' },
      { name: 'Anticellulite Launch', slug: 'anticellulite', leadsCount: 275, sentCount: 240, openedCount: 88, repliedCount: 15, failedCount: 10, status: 'Running' },
      { name: 'Body Care Clinics', slug: 'anticellulite', leadsCount: 130, sentCount: 130, openedCount: 55, repliedCount: 12, failedCount: 5, status: 'Completed' },
    ];

    let inserted = 0;
    let skipped = 0;
    for (const c of seedCampaigns) {
      const projectId = projects[c.slug];
      const exists = await Campaign.findOne({ name: c.name, projectId });
      if (!exists) {
        await Campaign.create({
          name: c.name,
          projectId,
          leadsCount: c.leadsCount,
          sentCount: c.sentCount,
          openedCount: c.openedCount,
          repliedCount: c.repliedCount,
          failedCount: c.failedCount,
          status: c.status,
        });
        inserted++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${Object.keys(projects).length} projects, ${inserted} campaigns inserted, ${skipped} already existed.`,
    });
  } catch (err: any) {
    console.error('[SEED ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
