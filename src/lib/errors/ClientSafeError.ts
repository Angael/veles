/** An intentional error whose message is safe to serialize to the browser. */
export class ClientSafeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientSafeError';
  }
}
