export const AWARDS_INTRO_IMAGE = '/reference/2026/11/retail-jeweller-excellence-2027-gala.png';
export const AWARDS_GUIDELINES_PDF =
  '/reference/2026/11/business-excellence-awards-2027-submission-guidelines.pdf';

export function awardsAssets(content = {}) {
  return {
    introImageUrl: content.introImageUrl || AWARDS_INTRO_IMAGE,
    guidelinesUrl: content.guidelinesUrl || AWARDS_GUIDELINES_PDF,
  };
}
