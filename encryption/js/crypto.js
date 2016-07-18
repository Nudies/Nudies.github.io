(function () {
  'use strict';

  function bufferToStr (buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }

  function strToBuffer (str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  /**
  * Generate and return a initialization vector.
  * @param {boolean} refresh If true, generate a new iv
  */
  var iv = (function () {
    var ivVal;
    return function (refresh) {
      if (!ivVal || refresh) {
        ivVal = window.crypto.getRandomValues(new Uint8Array(12));
      }
      return ivVal;
    }
  })();

  /**
  * Perfrom encrypt operation using a hashed password. Calls cb when completed or
  * errcb on failure.
  * @param {string} data Data to encrypt
  * @param {string} password Password to hash
  * @param {function} cb Callback function to perform when encryption completes
  *   will be passed the encrypted string as a parameter
  * @param {function} errcb Callback function to perform when an error occurs
  *   will be passed the error message as a parameter
  */
  function encrypt (data, password, cb, errcb) {
    window.crypto.subtle.digest({name: "SHA-256"}, strToBuffer(password)).then(function (hash) {
      window.crypto.subtle.importKey("raw", hash, {name: "AES-GCM"}, true, ["encrypt", "decrypt"]).then(function (key) {
        window.crypto.subtle.encrypt({name: "AES-GCM", iv: iv(true), tagLength: 128}, key, strToBuffer(data)).then(function (ct) {
          var encData = bufferToStr(new Uint8Array(ct));
          cb(encData);
        }, errcb);
      }, errcb);
    }, errcb);
  }

  /**
  * Perfrom decrypt operation using a hashed password. Calls cb when completed or
  * errcb on failure
  * @param {string} data Data to decrypt
  * @param {string} password Password to hash
  * @param {function} cb Callback function to perform when encryption completes
  *   will be passed the encrypted string as a parameter
  * @param {function} errcb Callback function to perform when an error occurs
  *   will be passed the error message as a parameter
  */
  function decrypt (data, password, cb, errcb) {
    window.crypto.subtle.digest({name: "SHA-256"}, strToBuffer(password)).then(function (hash) {
      window.crypto.subtle.importKey("raw", hash, {name: "AES-GCM"}, true, ["encrypt", "decrypt"]).then(function (key) {
        window.crypto.subtle.decrypt({name: "AES-GCM", iv: iv(), tagLength: 128}, key, strToBuffer(data)).then(function (ct) {
          var decData = bufferToStr(new Uint8Array(ct));
          cb(decData);
        }, errcb);
      }, errcb);
    }, errcb);
  }

  window.secret = {
    encrypt: encrypt,
    decrypt: decrypt
  };
})();
