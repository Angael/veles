/** Serializes async work so an older task can never finish after a newer task. */
export function createSequentialTaskQueue<Input>(task: (input: Input) => unknown) {
  let tail = Promise.resolve<unknown>(undefined);

  return (input: Input) => {
    const result = tail.then(() => task(input));
    tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
}
