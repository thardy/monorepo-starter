// this is for global shared functions
// NOTHING APP SPECIFIC SHOULD BE IN THIS FILE

export default class Utils {
  // this method is a cheap, halfway-decent way to convert a string to json without blowing up if it's not json
  // Usage:
  //   import Utils from '@common/utils/utils';
  //   const jsonBody = Utils.tryParseJSON(error._body);
  static tryParseJSON(jsonString: string) {
    try {
      const o = JSON.parse(jsonString);

      // Handle non-exception-throwing cases:
      // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
      // but... JSON.parse(null) returns null, and typeof null === "object",
      // so we must check for that, too. Thankfully, null is falsey, so this suffices:
      if (o && typeof o === 'object') {
        return o;
      }
    } catch (e) {}

    return false;
  }
}
