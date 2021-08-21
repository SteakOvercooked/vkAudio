// No documentation for this peace of code because i don't understand it either

'use strict';
var _r = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZO123456789+/=";

interface vk {
  id: number
}
declare var vk: vk
declare function each(arg1: any, arg2: any): any;

interface getOverCompiler {
  [index: number]: Function;
  [index: string]: Function;
}

var o: getOverCompiler = {
  v : function reverseStr(strToReverse: any) {
    return strToReverse.split("").reverse().join("");
  },
  r : function negate(data: any, value: any) {
    var width;
    data = data.split("");
    var rest = _r + _r;
    var index = data.length;
    for (; index--;) {
      if (~(width = rest.indexOf(data[index]))) {
        data[index] = rest.substr(width - value, 1);
      }
    }
    return data.join("");
  },
  s : function append(data: any, n: any) {
    var length = data.length;
    if (length) {
      var d = function(refNode, value) {
        var subNode_length = refNode.length;
        var info = [];
        if (subNode_length) {
          var index = subNode_length;
          value = Math.abs(value);
          for (; index--;) {
            value = (subNode_length * (index + 1) ^ value + index) % subNode_length;
            info[index] = value;
          }
        }
        return info;
      }(data, n);
      var i = 0;
      data = data.split("");
      for (; ++i < length;) {
        data[i] = data.splice(d[length - 1 - i], 1, data[i])[0];
      }
      data = data.join("");
    }
    return data;
  },
  x : function parseText(val:any, alt:any) {
    var outChance: any = [];
    return alt = alt.charCodeAt(0), each(val.split(""), function(canCreateDiscussions:any, strUtf8:any) {
      outChance.push(String.fromCharCode(strUtf8.charCodeAt(0) ^ alt));
    }), outChance.join("");
  },
  i : function encodeStart(c: any, initlength: any) {
    return o.s(c, initlength ^ vk.id);
  }
};

function getAudioLink(value: any): string {
  var original;
  var argumentsArray;
  var data = value.split("?extra=")[1].split("#");
  var str: any = "" === data[1] ? "" : a(data[1]);
  if (data = a(data[0]), "string" != typeof str || !data) {
    return value;
  }
  var i = (str = str ? str.split(String.fromCharCode(9)) : []).length;
  for (; i--;) {
    if (original = (argumentsArray = str[i].split(String.fromCharCode(11))).splice(0, 1, data)[0], !o[original]) {
      return value;
    }
    data = o[original].apply(null, argumentsArray);
  }
  if (data && "http" === data.substr(0, 4)) {
    return data;
  }
  return value;
}

function a(text: any) {
  if (!text || text.length % 4 == 1) {
    return false;
  }
  var d = 0;
  var c;
  var q = 0;
  var i = 0;
  var buffer = "";
  for (; c = text.charAt(i++);) {
    if (~(c = _r.indexOf(c)) && (d = q % 4 ? 64 * d + c : c, q++ % 4)) {
      buffer = buffer + String.fromCharCode(255 & d >> (-2 * q & 6));
    }
  }
  return buffer;
}

const loadingAnim = 
`
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="shape-rendering: auto;" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
    <g>
      <path d="M50 15A35 35 0 1 0 74.74873734152916 25.251262658470843" fill="none" stroke="#2787f5" stroke-width="6"></path>
      <path d="M49 5L49 25L59 15L49 5" fill="#2787f5"></path>
      <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50" keyTimes="0;1"></animateTransform>
    </g>
  </svg>
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" version="1.1" x="0" y="0" viewBox="0 0 46.47 46.47" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g>
    <g xmlns="http://www.w3.org/2000/svg">
      <path d="M46.222,41.889c0.658,1.521-0.042,3.287-1.562,3.943c-1.521,0.66-3.286-0.041-3.944-1.562   c-2.893-6.689-9.73-11.012-17.421-11.012c-7.868,0-14.747,4.32-17.523,11.004C5.292,45.416,4.175,46.112,3,46.112   c-0.384,0-0.773-0.073-1.15-0.229c-1.53-0.637-2.255-2.393-1.62-3.922c3.71-8.932,12.764-14.703,23.064-14.703   C33.379,27.26,42.379,33.002,46.222,41.889z M2.445,6.559c0-3.423,2.777-6.201,6.201-6.201c3.423,0,6.2,2.777,6.2,6.201   c0,3.426-2.777,6.203-6.2,6.203C5.222,12.761,2.445,9.984,2.445,6.559z M30.562,6.559c0-3.423,2.779-6.201,6.203-6.201   c3.423,0,6.2,2.777,6.2,6.201c0,3.426-2.776,6.203-6.2,6.203S30.562,9.984,30.562,6.559z" fill="#2787f5" data-original="#000000" class=""/>
    </g>
  </svg>
`

// some UI twisting and tickling
function addNotification(): HTMLDivElement {

    const notificationComponent = document.createElement("div");
    notificationComponent.classList.add("notification__vk_audio", "hidden");
    notificationComponent.style.top = `${window.innerHeight + document.body.scrollTop - 150}px`;
    notificationComponent.innerHTML = loadingAnim;

    document.body.appendChild(notificationComponent);
    setTimeout(() => {
        notificationComponent.classList.remove("hidden");
        notificationComponent.classList.add("showing");
    }, 0);
    setTimeout(() => {
        notificationComponent.classList.remove("showing");
    }, 800);

  return notificationComponent;
}

function removeNotification(notification: HTMLDivElement | null, cleanUp: () => void) {

    if (notification) {
        notification.classList.add("removing");
        setTimeout(() => {
            document.body.removeChild(notification);
            cleanUp();
        }, 800);
    }

}

function notifyAboutError(notification: HTMLDivElement | null, cleanUp: () => void) {

    if (notification) {
        notification.querySelectorAll("svg").forEach(svg => {
            svg.classList.add("vk_audio__error");
        });
        setTimeout(() => {
            removeNotification(notification, cleanUp);
        }, 2000);
    }

}

export { getAudioLink, addNotification, removeNotification, notifyAboutError };