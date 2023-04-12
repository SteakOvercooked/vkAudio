import { AsyncFunc } from '../types';

const REQUEST_MAX_TIME = 5000;

class TimeoutError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export async function timedFetch(
  ...args: Parameters<typeof fetch>
): Promise<[Response, AbortController['abort']]> {
  const controller = new AbortController();
  const cancel: AbortController['abort'] = controller.abort.bind(controller);

  args[1] = Object.assign(args[1] ?? {}, { signal: controller.signal });
  const timeout = setTimeout(() => controller.abort(), REQUEST_MAX_TIME);

  try {
    const response = await fetch(...args);
    clearTimeout(timeout);

    if (response.ok) return [response, cancel];

    throw new Error(response.statusText);
  } catch (err) {
    throw err;
  }
}

async function callTimed<T extends AsyncFunc>(
  fn: T,
  ...args: Parameters<T>
): Promise<Awaited<ReturnType<T>>> {
  return new Promise<any>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new TimeoutError('Timed out!')), REQUEST_MAX_TIME);

    fn(...args)
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((err) => reject(err));
  });
}

export class TimedResponse {
  private _text: Body['text'];
  private _json: Body['json'];
  private _arrayBuffer: Body['arrayBuffer'];

  private cancel: AbortController['abort'];

  constructor(response: Response, cancel: AbortController['abort']) {
    this.cancel = cancel;
    this._text = response.text.bind(response);
    this._json = response.json.bind(response);
    this._arrayBuffer = response.arrayBuffer.bind(response);
  }

  arrayBuffer = async () => {
    try {
      return await callTimed<typeof this._arrayBuffer>(this._arrayBuffer);
    } catch (err) {
      if (err instanceof TimeoutError) {
        this.cancel();
        return Promise.reject(err);
      }
      throw err;
    }
  };

  text = async () => {
    try {
      return await callTimed<typeof this._text>(this._text);
    } catch (err) {
      if (err instanceof TimeoutError) {
        this.cancel();
        return Promise.reject(err);
      }
      throw err;
    }
  };

  json = async () => {
    try {
      return await callTimed<typeof this._json>(this._json);
    } catch (err) {
      if (err instanceof TimeoutError) {
        this.cancel();
        return Promise.reject(err);
      }
      throw err;
    }
  };
}
