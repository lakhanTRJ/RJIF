export const adminRouteGroups = [
  {
    label: 'Event operations',
    items: [
      ['check-in', 'Event check-in', 'Scan delegate passes at the entrance'],
      ['registrations', 'Registrations', 'Payments, attendees and issued passes'],
      ['event-staff', 'Event staff', 'Manage restricted gate-team access'],
    ],
  },
  {
    label: 'Website pages',
    items: [
      ['home', 'Homepage', 'Hero, date, venue, counters and banners'],
      ['speakers', 'Speakers', 'Current and past speaker profiles'],
      ['agenda', 'Agenda', 'Conference topics and descriptions'],
      ['gallery', 'Event gallery', 'Previous-event photographs'],
      ['highlights', 'Video highlights', 'YouTube covers and links'],
      ['testimonials', 'Testimonials', 'Exhibition testimonial cards'],
      ['awards', 'Business awards', 'Award content and applications'],
      ['articles', 'Blog articles', 'Create, schedule and publish stories'],
    ],
  },
  {
    label: 'Sales & enquiries',
    items: [
      ['passes', 'Passes & fees', 'Prices, capacity and complimentary links'],
      ['submissions', 'Enquiries', 'Website form submissions'],
    ],
  },
  {
    label: 'Website settings',
    items: [
      ['pages', 'SEO & publishing', 'Search titles and page visibility'],
      ['footer', 'Footer & social links', 'Contact identity and social profiles'],
      ['media', 'Media library', 'Upload and reuse website images and PDF documents'],
    ],
  },
];

export const adminRoutes = adminRouteGroups.flatMap((group) => group.items);
