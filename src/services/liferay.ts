type OAuth2ClientOptions = {
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
  authorizeUrl?: string;
  redirectUri?: string;
  scopes?: string[];
};

type UserAgentApplication = any; // Replace with a proper type if available

export const Liferay: {
  OAuth2: {
    getAuthorizeURL: () => string;
    getBuiltInRedirectURL: () => string;
    getIntrospectURL: () => string;
    getTokenURL: () => string;
    getUserAgentApplication: (serviceName: string) => UserAgentApplication;
  };
  OAuth2Client: {
    FromParameters: (options: OAuth2ClientOptions) => object;
    FromUserAgentApplication: (userAgentApplicationId: string) => object;
    fetch: (url: string, options?: RequestInit) => Promise<Response>;
  };
  ThemeDisplay: {
    getCompanyGroupId: () => number;
    getScopeGroupId: () => number;
    getSiteGroupId: () => number;
    isSignedIn: () => boolean;
  };
  authToken: string;
} = (window as any).Liferay || {
  OAuth2: {
    getAuthorizeURL: () => "",
    getBuiltInRedirectURL: () => "",
    getIntrospectURL: () => "",
    getTokenURL: () => "",
    getUserAgentApplication: (_serviceName: string) => {
      return {};
    },
  },
  OAuth2Client: {
    FromParameters: (_options: OAuth2ClientOptions) => {
      return {};
    },
    FromUserAgentApplication: (_userAgentApplicationId: string) => {
      return {};
    },
    fetch: async (_url: string, _options: RequestInit = {}) => {
      return new Response();
    },
  },
  ThemeDisplay: {
    getCompanyGroupId: () => 0,
    getScopeGroupId: () => 0,
    getSiteGroupId: () => 0,
    isSignedIn: () => false,
  },
  authToken: "",
};
