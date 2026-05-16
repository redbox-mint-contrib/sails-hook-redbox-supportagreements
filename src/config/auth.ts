export const auth = {
  rules: [
    { path: '/:branding/:portal/api/support-agreements(/*)', role: 'Admin', can_update: true },
    { path: '/:branding/:portal/api/support-agreements', role: 'Admin', can_read: true }
  ]
};
