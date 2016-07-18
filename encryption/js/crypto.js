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

  var iv = (function () {
    var ivVal;
    return function (force) {
      if (!ivVal || force) {
        ivVal = window.crypto.getRandomValues(new Uint8Array(12));
      }
      return ivVal;
    }
  })();

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
