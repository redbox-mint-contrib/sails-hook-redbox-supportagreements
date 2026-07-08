import {
  anyField,
  apiActionResponseSchema,
  apiErrorResponseSchema,
  booleanField,
  defineApiRoute,
  numberField,
  objectField,
  responseField,
  stringField,
  type ApiRouteDefinition
} from '@researchdatabox/redbox-core';

const supportAgreementYearSchema = objectField(
  {
    agreedSupportDays: numberField('Agreed support days'),
    usedSupportDays: numberField('Used support days')
  },
  ['agreedSupportDays', 'usedSupportDays']
);

const releaseNoteSchema = objectField(
  {
    id: stringField('Release note identifier'),
    title: stringField('Release note title'),
    body: stringField('Release note body'),
    renderedBody: stringField('Rendered release note body'),
    releaseDate: stringField('Release date'),
    published: booleanField('Whether the release note is visible to readers'),
    createdAt: stringField('Created timestamp'),
    updatedAt: stringField('Updated timestamp')
  },
  ['id', 'title', 'body', 'published', 'createdAt', 'updatedAt']
);

const supportYearsSchema = objectField({}, [], 'Support years keyed by calendar year', supportAgreementYearSchema);
const releaseNotesSchema = objectField({}, [], 'Release note payload', true);
const supportAgreementSettingsSchema = objectField(
  {
    supportYears: supportYearsSchema,
    releaseNotes: anyField('Release note list')
  },
  ['supportYears', 'releaseNotes']
);
const yearParams = objectField({ year: stringField('Support agreement year') }, ['year']);
const releaseNoteParams = objectField({ id: stringField('Release note identifier') }, ['id']);
const releaseNoteQuery = objectField({ publishedOnly: stringField('Only return published release notes') });
const supportAgreementYearBody = objectField(
  {
    agreedSupportDays: numberField('Agreed support days'),
    usedSupportDays: numberField('Used support days')
  },
  []
);
const releaseNoteBody = objectField(
  {
    title: stringField('Release note title'),
    body: stringField('Release note body'),
    releaseDate: stringField('Release date'),
    published: booleanField('Whether the release note is visible to readers')
  },
  []
);

const badRequestResponse = responseField(apiErrorResponseSchema, 'Bad request');
const forbiddenResponse = responseField(apiErrorResponseSchema, 'Forbidden');
const notFoundResponse = responseField(apiErrorResponseSchema, 'Not found');
const internalServerErrorResponse = responseField(apiErrorResponseSchema, 'Internal server error');

function supportAgreementRoute(route: ApiRouteDefinition): ApiRouteDefinition {
  return defineApiRoute({
    csrf: false,
    security: [{ bearerAuth: [] }],
    tags: ['Support Agreements'],
    ...route
  });
}

export const supportAgreementApiRoutes = [
  supportAgreementRoute({
    method: 'get',
    path: '/:branding/:portal/api/support-agreements',
    controller: 'webservice/SupportAgreementController',
    action: 'getSettings',
    summary: 'Get support agreement settings',
    responses: {
      200: responseField(supportAgreementSettingsSchema, 'Support agreement settings'),
      500: internalServerErrorResponse
    }
  }),
  supportAgreementRoute({
    method: 'get',
    path: '/:branding/:portal/api/support-agreements/years',
    controller: 'webservice/SupportAgreementController',
    action: 'listYears',
    summary: 'List support agreement years',
    responses: {
      200: responseField(supportYearsSchema, 'Support agreement years'),
      500: internalServerErrorResponse
    }
  }),
  supportAgreementRoute({
    method: 'put',
    path: '/:branding/:portal/api/support-agreements/years/:year',
    controller: 'webservice/SupportAgreementController',
    action: 'setYear',
    request: {
      params: yearParams,
      body: {
        required: true,
        content: { 'application/json': { schema: supportAgreementYearBody } }
      }
    },
    summary: 'Set a support agreement year',
    responses: {
      200: responseField(supportAgreementYearSchema, 'Saved support agreement year'),
      400: badRequestResponse,
      403: forbiddenResponse
    }
  }),
  supportAgreementRoute({
    method: 'delete',
    path: '/:branding/:portal/api/support-agreements/years/:year',
    controller: 'webservice/SupportAgreementController',
    action: 'deleteYear',
    request: { params: yearParams },
    summary: 'Delete a support agreement year',
    responses: {
      200: responseField(apiActionResponseSchema, 'Support agreement year deleted'),
      403: forbiddenResponse,
      500: internalServerErrorResponse
    }
  }),
  supportAgreementRoute({
    method: 'get',
    path: '/:branding/:portal/api/support-agreements/release-notes',
    controller: 'webservice/SupportAgreementController',
    action: 'listReleaseNotes',
    request: { query: releaseNoteQuery },
    summary: 'List support agreement release notes',
    responses: {
      200: responseField(anyField('Release note list'), 'Support agreement release notes'),
      500: internalServerErrorResponse
    }
  }),
  supportAgreementRoute({
    method: 'post',
    path: '/:branding/:portal/api/support-agreements/release-notes',
    controller: 'webservice/SupportAgreementController',
    action: 'createReleaseNote',
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: releaseNoteBody } }
      }
    },
    summary: 'Create a support agreement release note',
    responses: {
      201: responseField(releaseNoteSchema, 'Created release note'),
      400: badRequestResponse,
      403: forbiddenResponse
    }
  }),
  supportAgreementRoute({
    method: 'patch',
    path: '/:branding/:portal/api/support-agreements/release-notes/:id',
    controller: 'webservice/SupportAgreementController',
    action: 'updateReleaseNote',
    request: {
      params: releaseNoteParams,
      body: {
        required: true,
        content: { 'application/json': { schema: releaseNoteBody } }
      }
    },
    summary: 'Update a support agreement release note',
    responses: {
      200: responseField(releaseNoteSchema, 'Updated release note'),
      400: badRequestResponse,
      403: forbiddenResponse,
      404: notFoundResponse
    }
  }),
  supportAgreementRoute({
    method: 'delete',
    path: '/:branding/:portal/api/support-agreements/release-notes/:id',
    controller: 'webservice/SupportAgreementController',
    action: 'deleteReleaseNote',
    request: { params: releaseNoteParams },
    summary: 'Delete a support agreement release note',
    responses: {
      200: responseField(apiActionResponseSchema, 'Release note deleted'),
      403: forbiddenResponse,
      404: notFoundResponse,
      500: internalServerErrorResponse
    }
  })
] as const;
