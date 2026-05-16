export const auth = {
  rules: [
    { path: '/:branding/:portal/admin/supportAgreement(/*)', role: 'Admin', can_read: true },
    { path: '/:branding/:portal/api/support-agreements(/*)', role: 'Admin', can_update: true },
    { path: '/:branding/:portal/api/support-agreements', role: 'Admin', can_read: true }
  ]
};
