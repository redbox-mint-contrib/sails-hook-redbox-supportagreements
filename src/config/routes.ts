export const routes = {
  'get /:branding/:portal/admin/supportAgreement': {
    controller: 'SupportAgreementController',
    action: 'index',
    skipAssets: true
  },
  'post /:branding/:portal/admin/supportAgreement/year': {
    controller: 'SupportAgreementController',
    action: 'saveYear',
    skipAssets: true
  },
  'post /:branding/:portal/admin/supportAgreement/year/delete': {
    controller: 'SupportAgreementController',
    action: 'deleteYear',
    skipAssets: true
  },
  'post /:branding/:portal/admin/supportAgreement/release-note': {
    controller: 'SupportAgreementController',
    action: 'createReleaseNote',
    skipAssets: true
  },
  'post /:branding/:portal/admin/supportAgreement/release-note/update': {
    controller: 'SupportAgreementController',
    action: 'updateReleaseNote',
    skipAssets: true
  },
  'post /:branding/:portal/admin/supportAgreement/release-note/delete': {
    controller: 'SupportAgreementController',
    action: 'deleteReleaseNote',
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
