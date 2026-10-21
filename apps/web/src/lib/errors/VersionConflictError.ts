import { ClientSafeError } from './ClientSafeError';

const versionConflictErrorName = 'VersionConflictError';

/**
 * A write was based on an outdated version token, so the server rejected it and kept the stored
 * record unchanged. Server functions answer it with HTTP 412 Precondition Failed.
 */
export class VersionConflictError extends ClientSafeError {
  readonly status = 412;

  constructor(message: string) {
    super(message);
    this.name = versionConflictErrorName;
  }
}

/** Server function errors reach the browser as plain `Error`s, so match on the serialized name. */
export function isVersionConflictError(error: unknown) {
  return error instanceof Error && error.name === versionConflictErrorName;
}
