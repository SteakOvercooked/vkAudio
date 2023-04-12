const REQUEST_MAX_TIME = 5000;
const BODY_READ_MAX_TIME = 30000;

class TimeoutError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

function makeTimed<T>(
  promise: Promise<T>,
  time: number,
  message: string = 'Timed out!'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(reject, time, new TimeoutError(message));
    promise
      .then((result) => {
        resolve(result);
      })
      .catch((err) => reject(err))
      .finally(() => clearTimeout(timeout));
  });
}

class TimedResponse {
  cancel: AbortController['abort'];

  text: Body['text'];
  json: Body['json'];
  arrayBuffer: Body['arrayBuffer'];

  constructor(response: Response, cancel: AbortController['abort']) {
    this.cancel = cancel;

    this.text = this.wrapMethod(response.text.bind(response));
    this.json = this.wrapMethod(response.json.bind(response));
    this.arrayBuffer = this.wrapMethod(response.arrayBuffer.bind(response));
  }

  private wrapMethod = <T>(method: (...args: unknown[]) => Promise<T>) => {
    return async () => {
      try {
        return await makeTimed(method(), BODY_READ_MAX_TIME, 'Body took too long to read!');
      } catch (err) {
        if (err instanceof TimeoutError) this.cancel();
        throw err;
      }
    };
  };
}

export class RequestGroup {
  private signal: AbortSignal;
  private cancel: AbortController['abort'];

  constructor() {
    const controller = new AbortController();
    this.signal = controller.signal;
    this.cancel = controller.abort.bind(controller);
  }

  timedFetch = async (...args: Parameters<typeof fetch>): Promise<TimedResponse> => {
    args[1] = Object.assign(args[1] ?? {}, { signal: this.signal });

    let response: Response;
    try {
      response = await makeTimed(
        fetch(...args),
        REQUEST_MAX_TIME,
        'Request took too long to fulfill!'
      );
    } catch (err) {
      if (err instanceof TimeoutError) this.cancel();
      throw err;
    }

    if (response.ok) return new TimedResponse(response, this.cancel);
    throw new Error(response.statusText);
  };
}
