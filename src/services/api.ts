import { Liferay } from "./liferay";

const { REACT_APP_LIFERAY_HOST = window.location.origin } = process.env;

console.log("REACT_APP_LIFERAY_HOST....", REACT_APP_LIFERAY_HOST);

type BaseFetchOptions = RequestInit & {
  headers?: HeadersInit;
};

const baseFetch = async (
  url: string,
  options: BaseFetchOptions = {},
  baseUrl: string = REACT_APP_LIFERAY_HOST
): Promise<Response> => {
  const { headers = {}, ...otherProps } = options;

  const defaultHeaders: HeadersInit = {
    "x-csrf-token": Liferay.authToken,
    ...headers,
  };

  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

  return fetch(fullUrl, {
    headers: defaultHeaders,
    ...otherProps,
  });
};

export default baseFetch;
