/**
 * Copyright reelyActive 2026
 * We believe in an open Internet of Things
 */


import Raddec from "raddec";


/**
 * MessageDecoder Class
 * Decodes messages from one or more MQTT brokers and forwards the packets to
 * the given BarnowlVda5050 instance.
 */
class MessageDecoder {

  /**
   * MessageDecoder constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    options = options || {};

    this.barnowl = options.barnowl;
  }

  /**
   * Handle message from a given broker, specified by the origin
   * @param {Buffer} message The message as a Buffer.
   * @param {string} origin The unique origin identifier (i.e. topic).
   * @param {number} time The time of the data capture.
   * @param {Object} decodingOptions The message decoding options.
   */
  handleMessage(message, origin, time, decodingOptions) {
    const data = convertMessageToJson(message);
    if(data && isValidVersion(data.version)) {
      const majorVersion = data.version.split(".")[0];

      switch(majorVersion) { // TODO: support more versions, more broadly
        case "3":
          if(Object.hasOwn(data, "mobileRobotPosition")) {
            const raddec = new Raddec({
              transmitterId: data.serialNumber,
              transmitterIdType: Raddec.identifiers.TYPE_UNKNOWN,
              position: [ data.mobileRobotPosition.x,
                          data.mobileRobotPosition.y ],
              timestamp: new Date(data.timestamp).getTime()
            });

            return this.barnowl.handleRaddec(raddec);
          }
        default:
          return;
      }
    }
  }

}


/**
 * Convert the given MQTT message to JSON, if possible.
 * @param {Buffer} message The message itself, as a Buffer.
 * @return {Object} The message as JSON, or null if undecipherable.
 */
function convertMessageToJson(message) {
  try {
    const jsonString = message.toString("utf8");
    return JSON.parse(jsonString);
  }
  catch(error) {
    return null;
  }
}


/**
 * Determine if the given version string is valid.
 * @param {string} version The version, if defined, as a string.
 * @return {boolean} Whether the version string is valid or not.
 */
function isValidVersion(version) {
  return (typeof version === "string") &&
         ([ ...version ].filter((c) => c === ".").length === 2);
}


export default MessageDecoder;
