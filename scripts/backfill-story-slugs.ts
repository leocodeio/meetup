import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Backfill script to generate slugs for existing stories
 * This script:
 * 1. Finds all projects
 * 2. For each project, finds stories without slugs
 * 3. Assigns sequential slugs (TK-1, TK-2, etc.) ordered by creation date
 * 4. Updates the project's storyCounter to reflect the highest number used
 */
async function backfillStorySlugs() {
  console.log("🚀 Starting story slug backfill...\n");

  try {
    // Fetch all projects
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        storyCounter: true,
      },
    });

    console.log(`📊 Found ${projects.length} projects to process\n`);

    for (const project of projects) {
      console.log(`📁 Processing project: ${project.name} (${project.id})`);

      // Find stories without slugs for this project
      const stories = await prisma.story.findMany({
        where: {
          projectId: project.id,
          slug: null,
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true },
      });

      if (stories.length === 0) {
        console.log(`   ✅ No stories need slugs\n`);
        continue;
      }

      console.log(`   📝 Found ${stories.length} stories without slugs`);

      let counter = project.storyCounter || 0;

      // Assign slugs to each story
      for (const story of stories) {
        counter++;
        const slug = `TK-${counter}`;

        await prisma.story.update({
          where: { id: story.id },
          data: { slug },
        });

        console.log(`   ✓ ${slug} → "${story.title.substring(0, 50)}${story.title.length > 50 ? '...' : ''}"`);
      }

      // Update project counter
      await prisma.project.update({
        where: { id: project.id },
        data: { storyCounter: counter },
      });

      console.log(`   📊 Updated project counter to ${counter}\n`);
    }

    console.log("✅ Backfill complete!");
    console.log("\n📈 Summary:");

    // Get final counts
    const totalStories = await prisma.story.count();
    const storiesWithSlugs = await prisma.story.count({ where: { slug: { not: null } } });

    console.log(`   Total stories: ${totalStories}`);
    console.log(`   Stories with slugs: ${storiesWithSlugs}`);
    console.log(`   Coverage: ${((storiesWithSlugs / totalStories) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error("❌ Error during backfill:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
backfillStorySlugs()
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
