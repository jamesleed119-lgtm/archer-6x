declare const google: {
  ima?: {
    settings?: { setPageUrl?: (url: string) => void };
    AdsRequest?: {
      __patched?: boolean;
      prototype?: unknown;
      new (): {
        descriptionUrl?: string;
        contentUrl?: string;
        url?: string;
        pageUrl?: string;
      };
    };
  };
};
