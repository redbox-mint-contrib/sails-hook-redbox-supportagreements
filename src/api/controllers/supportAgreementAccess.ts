type RequestUserLike = {
  username?: unknown;
};

type RequestLike = {
  user?: RequestUserLike;
  session?: {
    user?: RequestUserLike;
    username?: unknown;
    passport?: {
      user?: RequestUserLike;
    };
  };
};

function asUsername(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function isStringArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function getRequestUsername(req: Sails.Req): string | undefined {
  const request = req as RequestLike;

  return asUsername(request.user?.username)
    ?? asUsername(request.session?.user?.username)
    ?? asUsername(request.session?.passport?.user?.username)
    ?? asUsername(request.session?.username);
}

export function getManagementAllowedUsernames(): string[] {
  const config = (globalThis as typeof globalThis & {
    sails?: {
      config?: {
        supportAgreement?: {
          managementAllowedUsernames?: unknown;
        };
      };
    };
  }).sails?.config?.supportAgreement?.managementAllowedUsernames;

  if (!isStringArray(config)) {
    return ['admin'];
  }

  const usernames = config.filter((value): value is string => typeof value === 'string');
  return usernames.length > 0 ? usernames : ['admin'];
}

export function canManageSupportAgreements(req: Sails.Req): boolean {
  const username = getRequestUsername(req);
  if (!username) {
    return false;
  }

  return getManagementAllowedUsernames().includes(username);
}
