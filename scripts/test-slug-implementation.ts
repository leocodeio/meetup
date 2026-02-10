import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Test script to verify slug implementation
 * This script checks:
 * 1. If projects have storyCounter initialized
 * 2. If existing stories have slugs
 * 3. Database schema is properly configured
 */
async function testSlugImplementation() {
  console.log("🔍 Testing Story Slug Implementation...\n");

  try {
    // Check projects
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        storyCounter: true,
        _count: {
          select: {
            stories: true,
          },
        },
      },
    });

    console.log(`📊 Projects Found: ${projects.length}\n`);

    for (const project of projects) {
      console.log(`📁 Project: ${project.name}`);
      console.log(`   Story Counter: ${project.storyCounter}`);
      console.log(`   Total Stories: ${project._count.stories}`);

      // Check stories in this project
      const stories = await prisma.story.findMany({
        where: { projectId: project.id },
        select: {
          id: true,
          title: true,
          slug: true,
          archived: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
        take: 5, // Show first 5 stories
      });

      const storiesWithSlugs = stories.filter((s) => s.slug !== null).length;
      const archivedCount = stories.filter((s) => s.archived).length;

      console.log(`   Stories with slugs: ${storiesWithSlugs}/${stories.length}`);
      console.log(`   Archived stories: ${archivedCount}`);

      if (stories.length > 0) {
        console.log(`   Sample stories:`);
        stories.forEach((story, idx) => {
          const slugDisplay = story.slug || "❌ NO SLUG";
          const archivedFlag = story.archived ? "📦 ARCHIVED" : "";
          console.log(
            `     ${idx + 1}. ${slugDisplay} - "${story.title.substring(0, 40)}${story.title.length > 40 ? '...' : ''}" ${archivedFlag}`
          );
        });
      }

      console.log("");
    }

    // Overall statistics
    const totalStories = await prisma.story.count();
    const storiesWithSlugs = await prisma.story.count({
      where: { slug: { not: null } },
    });
    const archivedStories = await prisma.story.count({
      where: { archived: true },
    });

    console.log("📈 Overall Statistics:");
    console.log(`   Total Stories: ${totalStories}`);
    console.log(`   With Slugs: ${storiesWithSlugs} (${totalStories > 0 ? ((storiesWithSlugs / totalStories) * 100).toFixed(1) : 0}%)`);
    console.log(`   Archived: ${archivedStories} (${totalStories > 0 ? ((archivedStories / totalStories) * 100).toFixed(1) : 0}%)`);

    if (storiesWithSlugs < totalStories) {
      console.log("\n⚠️  Some stories are missing slugs!");
      console.log("   Run the backfill script:");
      console.log("   npx tsx scripts/backfill-story-slugs.ts");
    } else {
      console.log("\n✅ All stories have slugs!");
    }

    // Check if any project has storyCounter = 0 but has stories
    const projectsNeedingUpdate = projects.filter(
      (p) => p.storyCounter === 0 && p._count.stories > 0
    );

    if (projectsNeedingUpdate.length > 0) {
      console.log("\n⚠️  Projects with stories but counter at 0:");
      projectsNeedingUpdate.forEach((p) => {
        console.log(`   - ${p.name} (${p._count.stories} stories)`);
      });
      console.log("   Run the backfill script to fix this.");
    }

  } catch (error) {
    console.error("❌ Error during test:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSlugImplementation()
  .then(() => {
    console.log("\n✅ Test complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
