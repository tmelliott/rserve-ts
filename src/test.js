function create(opts) {
  var socket = opts.host || "http://127.0.0.1:8081";
  var result;

  function hand_shake() {
    result.running = true;
  }

  var received_handshake = false;
  socket.onmessage = function (msg) {
    if (!received_handshake) {
      hand_shake(msg);
      received_handshake = true;
    }
  };
  socket.onclose = function () {
    result.running = false;
    result.closed = true;
  };

  function _encode_string(string) {
    var buffer = new ArrayBuffer(string.length * 2);
    var view = new Uint16Array(buffer);
    for (var i = 0, strLen = string.length; i < strLen; i++) {
      view[i] = string.charCodeAt(i);
    }
    return buffer;
  }

  function _cmd(command, buffer, k, string, queue) {
    return {
      command: command,
      buffer: buffer,
      k: k,
      string: string,
      queue: queue,
    };
  }

  return {
    running: false,
    closed: false,
    close: function () {
      socket.close();
    },
    login: function (command, k) {
      _cmd(10, command, k, command);
    },
  };
}
