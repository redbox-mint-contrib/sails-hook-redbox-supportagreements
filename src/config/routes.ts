export const routes = {
  '/:branding/:portal/admin/supportAgreement': {
    controller: 'SupportAgreementController',
    action: 'index',
    skipAssets: true
  },
  'get /:branding/:portal/api/support-agreements': {
    controller: 'webservice/SupportAgreementController',
    action: 'getSettings',
    csrf: false
  },
  'get /:branding/:portal/api/support-agreements/years': {
    controller: 'webservice/SupportAgreementController',
    action: 'listYears',
    csrf: false
  },
  'put /:branding/:portal/api/support-agreements/years/:year': {
    controller: 'webservice/SupportAgreementController',
    action: 'setYear',
    csrf: false
  },
  'delete /:branding/:portal/api/support-agreements/years/:year': {
    controller: 'webservice/SupportAgreementController',
    action: 'deleteYear',
    csrf: false
  },
  'get /:branding/:portal/api/support-agreements/release-notes': {
    controller: 'webservice/SupportAgreementController',
    action: 'listReleaseNotes',
    csrf: false
  },
  'post /:branding/:portal/api/support-agreements/release-notes': {
    controller: 'webservice/SupportAgreementController',
    action: 'createReleaseNote',
    csrf: false
  },
  'patch /:branding/:portal/api/support-agreements/release-notes/:id': {
    controller: 'webservice/SupportAgreementController',
    action: 'updateReleaseNote',
    csrf: false
  },
  'delete /:branding/:portal/api/support-agreements/release-notes/:id': {
    controller: 'webservice/SupportAgreementController',
    action: 'deleteReleaseNote',
    csrf: false
  }
};
