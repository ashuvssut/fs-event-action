# fs-event-action

Run a cancellable asynchronous action triggered via file system (FS) events.

- Utilizes [chokidar](https://github.com/paulmillr/chokidar) to monitor FS events in a directory.
  - Configuration for watch options can be found in [`src/config.ts`](src/config.ts).
- Upon any FS event, a "Cancellable" action is initiated. The cancellable action is crafted using [c-promise2](https://github.com/DigitalBrainJS/c-promise).
  - Explore CodeSandbox examples in the [c-promise2](https://github.com/DigitalBrainJS/c-promise) repository to understand its usage.
  - Refer to [this video](https://youtu.be/Em2jqwROdZc) for insights into how `generator`/`yield` is employed to write `async`/`await` logic.
    - Generator functions are employed by `c-promise2` to create cancellable asynchronous routines.
  - A custom `ShellProcess` class is available in [`src/utils/ShellProcess.ts`](src/utils/ShellProcess.ts) for executing cancellable terminal commands.

## Usage

- Run development script: `yarn dev`
- Build script: `yarn build`
  - Outputs to `/dist`

### Create Your Own Event Action

- Refer to [`src/event-action.example.ts`](src/event-action.example.ts) for an example demonstrating how to create cancellable logic.
- Subsequent triggers of the Event Action will cancel the previously triggered Event Action if it is still running.

## Demo

- This video demonstates the working of [`src/event-action.example.ts`](src/event-action.example.ts)

https://github.com/ashuvssut/fs-event-action/assets/60546840/4e8c1b8e-14a5-4884-adf2-b9635d6cca43




## Further Development

- The current examples may have incomplete TypeScript type definitions due to the absence of type definitions for the `c-promise2` library.
