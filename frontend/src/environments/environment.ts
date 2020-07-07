// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  redirect_uri: 'https://ktp0b5os1g.execute-api.us-east-2.amazonaws.com/dev/callbackLocal',
  obscurifyApiUrl: 'https://ktp0b5os1g.execute-api.us-east-2.amazonaws.com/dev',
  client_id: '31e362f6085c4309a2e1a6d2c0f8d8ec'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
