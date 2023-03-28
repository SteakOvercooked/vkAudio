'use strict';
var _r = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZO123456789+/=';
var VK_ID = null;

var o = {
  v: function reverseStr(strToReverse) {
    return strToReverse.split('').reverse().join('');
  },
  r: function negate(data, value) {
    var width;
    data = data.split('');
    var rest = _r + _r;
    var index = data.length;
    for (; index--; ) {
      if (~(width = rest.indexOf(data[index]))) {
        data[index] = rest.substr(width - value, 1);
      }
    }
    return data.join('');
  },
  s: function append(data, n) {
    var length = data.length;
    if (length) {
      var d = (function (refNode, value) {
        var subNode_length = refNode.length;
        var info = [];
        if (subNode_length) {
          var index = subNode_length;
          value = Math.abs(value);
          for (; index--; ) {
            value = ((subNode_length * (index + 1)) ^ (value + index)) % subNode_length;
            info[index] = value;
          }
        }
        return info;
      })(data, n);
      var i = 0;
      data = data.split('');
      for (; ++i < length; ) {
        data[i] = data.splice(d[length - 1 - i], 1, data[i])[0];
      }
      data = data.join('');
    }
    return data;
  },
  x: function parseText(val, alt) {
    var outChance = [];
    return (
      (alt = alt.charCodeAt(0)),
      each(val.split(''), function (canCreateDiscussions, strUtf8) {
        outChance.push(String.fromCharCode(strUtf8.charCodeAt(0) ^ alt));
      }),
      outChance.join('')
    );
  },
  i: function encodeStart(c, initlength) {
    return o.s(c, initlength ^ VK_ID);
  },
};

function getStreamLink(value, vk_id) {
  var original;
  var argumentsArray;
  VK_ID = vk_id;
  var data = value.split('?extra=')[1].split('#');
  var str = '' === data[1] ? '' : a(data[1]);
  if (((data = a(data[0])), 'string' != typeof str || !data)) {
    return value;
  }
  var i = (str = str ? str.split(String.fromCharCode(9)) : []).length;
  for (; i--; ) {
    if (
      ((original = (argumentsArray = str[i].split(String.fromCharCode(11))).splice(0, 1, data)[0]),
      !o[original])
    ) {
      return value;
    }
    data = o[original].apply(null, argumentsArray);
  }
  if (data && 'http' === data.substr(0, 4)) {
    return data;
  }
  return value;
}

function a(text) {
  if (!text || text.length % 4 == 1) {
    return false;
  }
  var d = 0;
  var c;
  var q = 0;
  var i = 0;
  var buffer = '';
  for (; (c = text.charAt(i++)); ) {
    if (~(c = _r.indexOf(c)) && ((d = q % 4 ? 64 * d + c : c), q++ % 4)) {
      buffer = buffer + String.fromCharCode(255 & (d >> ((-2 * q) & 6)));
    }
  }
  return buffer;
}

export default getStreamLink;
