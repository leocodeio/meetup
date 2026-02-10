/**
 * URL builder utilities for consistent routing
 */

/**
 * Builds a story URL
 * @param locale - The current locale (e.g., "en")
 * @param projectId - The project ID
 * @param slug - The story slug (e.g., "TK-42")
 * @returns Story URL path
 */
export function getStoryUrl(
  locale: string,
  projectId: string,
  slug: string
): string {
  return `/${locale}/dashboard/projects/${projectId}/story/${slug}`;
}

/**
 * Builds a full shareable story URL with origin
 * @param locale - The current locale (e.g., "en")
 * @param projectId - The project ID
 * @param slug - The story slug (e.g., "TK-42")
 * @returns Full story URL with origin
 */
export function getStoryShareUrl(
  locale: string,
  projectId: string,
  slug: string
): string {
  if (typeof window === 'undefined') {
    return getStoryUrl(locale, projectId, slug);
  }
  return `${window.location.origin}${getStoryUrl(locale, projectId, slug)}`;
}

/**
 * Builds a sprint board URL
 * @param locale - The current locale (e.g., "en")
 * @param projectId - The project ID
 * @param sprintId - The sprint ID
 * @returns Sprint board URL path
 */
export function getSprintUrl(
  locale: string,
  projectId: string,
  sprintId: string
): string {
  return `/${locale}/dashboard/projects/${projectId}/sprints/${sprintId}`;
}

/**
 * Builds a project dashboard URL
 * @param locale - The current locale (e.g., "en")
 * @param projectId - The project ID
 * @returns Project dashboard URL path
 */
export function getProjectUrl(
  locale: string,
  projectId: string
): string {
  return `/${locale}/dashboard/projects/${projectId}`;
}
