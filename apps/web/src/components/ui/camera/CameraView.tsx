import { CameraIcon, CameraOffIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import css from './CameraView.module.css';
import type { Camera, CameraStatus } from './useCamera';

type CameraViewProps = {
  camera: Camera;
  /** Overlays drawn on top of the preview, e.g. scan outlines or camera controls. */
  children?: ReactNode;
};

/** Live camera preview that explains why the camera is not showing. */
export function CameraView({ camera, children }: CameraViewProps) {
  return (
    <div className={css.view}>
      <video aria-label='Live camera preview' autoPlay muted playsInline ref={camera.videoRef} />
      {camera.status === 'live' ? null : <CameraMessage status={camera.status} />}
      {children}
    </div>
  );
}

const messages: Record<Exclude<CameraStatus, 'live'>, [title: string, detail: string]> = {
  busy: [
    'Camera in use',
    'Another app or browser tab may be using the camera. Close it and try again.',
  ],
  denied: ['Camera permission denied', 'Allow camera access in your browser settings.'],
  error: ['Camera stopped', 'We could not read from the camera. Go back and try again.'],
  starting: ['Starting camera…', 'You may be asked for permission.'],
  unavailable: ['Camera unavailable', 'This browser cannot access a camera.'],
};

function CameraMessage({ status }: { status: Exclude<CameraStatus, 'live'> }) {
  const [title, detail] = messages[status];
  const starting = status === 'starting';

  return (
    <div className={css.message} role={starting ? 'status' : 'alert'}>
      {starting ? <CameraIcon aria-hidden='true' /> : <CameraOffIcon aria-hidden='true' />}
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}
