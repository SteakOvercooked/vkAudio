/*
The way that this works:
1 - Override VK's functions that are exported on the window object to be able to react when a mouse is over the "more" button on a soundtrack.
2 - Create a handler (an above mentioned reaction) that finds the node to watch, starts watching it and when a child is inserted (contextual menu)
adds the "download" option.
3 - When a user clicks on "download", get audio data by calling AudioUtils.asObject() on audio-data attribute value of the primary div of a song. Extract
needed for the request data from there, then make a request to "https://vk.com/al_audio.php?act=reload_audio" passing concatenated values as ids parameter.
This gives us a link of form "https://vk.com/mp3/audio_api_unavailable.mp3?extra=..." that needs to be passed to a specific algorithm (found with blood and
sweat... and debugger). The result of the algorithm is a link of 2 types (not sure how to predict the type though) that are described below in the code. With that,
it is possible to trim a part of the link and replace "/index.m3u8" with ".mp3" getting a link to mp3 file as a result.
4 - Make a request to get the blob of an url, then construct an object url for the blob. Follow the blobURL to force the downloading of a file. 
*/

import { getAudioLink, addNotification, removeNotification, notifyAboutError } from './helpers'; // helpers is for vk's link transformation functions and for notifications

// request URL to get unavailable mp3 link and construct m3u8 link out of it
const unavailableAudio = 'https://vk.com/al_audio.php?act=reload_audio';

// CURRENT_TRACK - the one that the user is hovering over.
// TRACK_TITLE - performer + title without "."
// NOTIFICATION - current notification, because 1 download at a time is allowed.
let CURRENT_TRACK: HTMLDivElement, TRACK_TITLE: string, NOTIFICATION: HTMLDivElement | null;

// interface and AudioUtils variable to make TS happy :) Represent VK's AudioUtils class and two of its functions that are used
interface AU {
  onRowOver: (thisArg: any, event: MouseEvent) => void;
  asObject: (data: string) => any;
}
declare var AudioUtils: AU;

// this function takes [audio-data] attribute of a track element and returns an object with that data (and maybe some extra, who knows?)
function extractReqParameter(rawData: string): string {
  const excessiveDetails = AudioUtils.asObject(JSON.parse(rawData));
  TRACK_TITLE = `${(excessiveDetails.performer as string).replace(/\./g, '')} - ${(excessiveDetails.title as string).replace(
    /\./g,
    ''
  )} (vk_audio)`;
  return excessiveDetails.fullId + '_' + excessiveDetails.actionHash + '_' + excessiveDetails.urlHash;
}

// this function fetches the passed url, creates a blob, creates an object link and follows it so a file gets downloaded
function downloadMP3(url: string) {
  return new Promise<void>((resolve, reject) => {
    fetch(url)
      .then((result) => {
        if (result.ok) {
          result
            .blob()
            .then((blb) => {
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blb);
              a.setAttribute('download', TRACK_TITLE);
              a.click();
              resolve();
            })
            .catch((err) => reject('Unable to create an MP3 BLOB'));
        } else {
          reject('Bad response type');
        }
      })
      .catch((err) => reject('MP3 URL is unaccessible'));
  });
}

/*

2 types of links:

https://psv4.vkuseraudio.net/c813230/u214475989/db125367ad4/audios/9899b7c1f381/index.m3u8?

https://cs9-22v4.vkuseraudio.net/p4/db59a6b94bf/e0819fc7302e93/index.m3u8?

*/

// this function replaces some stuff and deletes the other stuff to get an mp3 link out of an m3u8 link
function getMP3Link(m3u8Link: string) {
  // see what type of link it is
  const start = m3u8Link.indexOf('//'),
    end = m3u8Link.indexOf('.vkuseraudio');
  let regex: RegExp;
  if (m3u8Link.substring(start, end).indexOf('-') !== -1) {
    // if the second type of link (which is prevailing tbh)
    regex = /(\/p\d+\/)(\w+\/)(\w+)(\/index\.m3u8)/;
  } else {
    regex = /(\.net\/\w+\/\w+\/)(\w+\/)(.+)(\/index\.m3u8)/;
  }
  return m3u8Link.replace(regex, '$1$3.mp3');
}

// This function requests the track's mp3Unavailable link.
// Don't ask me why the response type is "text/html" for my extension and "application/json" for VK even though the requests are identical.
// (setting "credentials" to "include" doesn't help)
const decoder = new TextDecoder();
function getMP3Unavailable(requestId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const data = `al=1&ids=${requestId}`;
    const headers = new Headers();
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
    fetch(unavailableAudio, {
      body: data,
      headers: headers,
      method: 'POST',
    })
      .then((response) => {
        if (response.body) {
          const reader = response.body.getReader();
          reader
            .read()
            .then((blb) => {
              // only the link is extracted
              const text = decoder.decode(blb.value);
              const start = text.indexOf('https:');
              if (start !== -1) {
                const end = text.indexOf('"', start + 1);
                resolve(text.substring(start, end));
              } else {
                reject('Bad response data');
              }
            })
            .catch((err) => {
              reject('Unable to create an MP3Unavailabe BLOB');
            });
        } else {
          reject("The response doesn't have a body");
        }
      })
      .catch((err) => {
        reject('The request link is unaccessible');
      });
  });
}

// this function creates a button and its download event handler
function createDownloadAction(): HTMLButtonElement {
  const but = document.createElement('button');
  but.classList.add('audio_row__more_action', 'audio_row__more_action_download');
  but.innerText = 'Скачать';
  but.addEventListener('click', async () => {
    // only 1 download action at a time
    if (!NOTIFICATION) {
      NOTIFICATION = addNotification();
      const audioDataString = CURRENT_TRACK.getAttribute('data-audio');
      if (audioDataString) {
        const requestParam = extractReqParameter(audioDataString);
        try {
          const mp3aUnavailable = await getMP3Unavailable(requestParam);

          const tryGetLink = new Promise<string>((resolve, reject) => {
            let m3u8Link: string,
              counter = 1;

            // The reason for using interval is that sometimes VK's getAudioLink function returns the same thing that
            // was passed to it (like when a track has just started playing and gets immediately downloaded... SMH).
            // The interval tries to get the result 5 times and rejects the promise if the counter is exceeded.
            let intervalID = setInterval(() => {
              m3u8Link = getAudioLink(mp3aUnavailable);

              // if we got an m3u8 link
              if (m3u8Link.indexOf('.mp3?') === -1) {
                clearInterval(intervalID);
                resolve(m3u8Link);
              } else {
                counter += 1;
                if (counter > 5) {
                  clearInterval(intervalID);
                  reject('Unable to get the link to MP3 file');
                }
              }
            }, 150);
          });

          const m3u8Link = await tryGetLink;
          const mp3Link = getMP3Link(m3u8Link);
          await downloadMP3(mp3Link);
          removeNotification(NOTIFICATION, () => {
            NOTIFICATION = null;
          });
        } catch (err) {
          notifyAboutError(NOTIFICATION, () => {
            NOTIFICATION = null;
          });
        }
      } else {
        notifyAboutError(NOTIFICATION, () => {
          NOTIFICATION = null;
        });
      }
    }
  });
  return but;
}

const OBSERVER = new MutationObserver((mutations, observer) => {
  // Each time the user hovers the button "more" the contextual menu appears.
  // When it appears a new "download" button must be inserted.
  const actionList = <HTMLDivElement>mutations[0].addedNodes[0];
  const moreActionList = <HTMLDivElement>actionList.querySelector('div._audio_row__more_actions.audio_row__more_actions');

  // checking if it wasn't an accidential hover and the user is still on the element
  if (moreActionList) {
    // since add_to_playlist is always there we can rely on that
    const refNode = moreActionList.querySelector('button.audio_row__more_action.audio_row__more_action_add_to_playlist');
    if (refNode) {
      const but = createDownloadAction();
      moreActionList.insertBefore(but, refNode);

      // making sure that if the contextual menu appears above the audio element it is brought one button higher to avoid UI bug
      let top = parseInt(actionList.style.top);
      if (top < 0) actionList.style.top = `${top - 32}px`;
    }
  }
  observer.disconnect();
});

// onRowOver is going to be extended so remember it
const regularOnRowOver = AudioUtils.onRowOver;

function extendedOnRowOver(thisArg: any, event: MouseEvent) {
  const target = <HTMLElement>event.target;

  // Weirdly enough the location of the contextual menu in the document is NOT consistent throughout the website.
  // It can be placed in the "#wk_box" div, in the "body" of the document or in the parent div of the button "more".
  // What's even more weird and despicable, the ones placed in the first 2 locations are NOT removed from the DOM afterwards.

  // if target still exists (maybe it was a very fast hover)
  if (target) {
    if (target.tagName === 'BUTTON') {
      if (target.getAttribute('data-action') === 'more') {
        // primary div of an audio element with the data
        CURRENT_TRACK = <HTMLDivElement>target.closest('div[data-audio]');

        // check what to watch with observer depending on where we are on the website
        const wk_box = <HTMLDivElement>document.querySelector('div#wk_box');
        let watchedNode = document.body;
        if (wk_box) watchedNode = wk_box;
        else {
          const audio_layer = <HTMLDivElement>document.querySelector('div#audio_layer_tt');
          const audio_page = document.querySelector('div#content > div._audio_page_layout.audio_page_layout');

          // check if the user is in the audious page or has audio layer opened up
          if (audio_page || (audio_layer && audio_layer.style.display !== 'none')) watchedNode = <HTMLDivElement>target.parentNode;
        }
        OBSERVER.observe(watchedNode, {
          childList: true,
        });
      }
    }
  }

  // calling the native onRowOver to do its thing
  regularOnRowOver(thisArg, event);
}

// overriding regular onRowOver with the extended version
AudioUtils.onRowOver = extendedOnRowOver;
