import { CameraIcon, CameraOffIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Localized } from '@/lib/i18n/locale';
import css from './CameraView.module.css';
import type { Camera, CameraStatus } from './useCamera';

type CameraViewProps = {
  camera: Camera;
  /** Overlays drawn on top of the preview, e.g. scan outlines or camera controls. */
  children?: ReactNode;
};

/** Live camera preview that explains why the camera is not showing. */
export function CameraView({ camera, children }: CameraViewProps) {
  const { t } = useI18n();
  return (
    <div className={css.view}>
      <video
        aria-label={t({ en: 'Live camera preview', pl: 'Podgląd z kamery' })}
        autoPlay
        muted
        playsInline
        ref={camera.videoRef}
      />
      {camera.status === 'live' ? null : <CameraMessage status={camera.status} />}
      {children}
    </div>
  );
}

const messages: Record<Exclude<CameraStatus, 'live'>, [title: Localized, detail: Localized]> = {
  busy: [
    { en: 'Camera in use', pl: 'Kamera jest zajęta' },
    {
      en: 'Another app or browser tab may be using the camera. Close it and try again.',
      pl: 'Inna aplikacja lub karta przeglądarki może używać kamery. Zamknij ją i spróbuj ponownie.',
    },
  ],
  denied: [
    { en: 'Camera permission denied', pl: 'Brak dostępu do kamery' },
    {
      en: 'Allow camera access in your browser settings.',
      pl: 'Zezwól na dostęp do kamery w ustawieniach przeglądarki.',
    },
  ],
  error: [
    { en: 'Camera stopped', pl: 'Kamera zatrzymana' },
    {
      en: 'We could not read from the camera. Go back and try again.',
      pl: 'Nie udało się odczytać obrazu z kamery. Wróć i spróbuj ponownie.',
    },
  ],
  starting: [
    { en: 'Starting camera…', pl: 'Uruchamianie kamery…' },
    { en: 'You may be asked for permission.', pl: 'Przeglądarka może poprosić o zgodę.' },
  ],
  unavailable: [
    { en: 'Camera unavailable', pl: 'Kamera niedostępna' },
    { en: 'This browser cannot access a camera.', pl: 'Ta przeglądarka nie ma dostępu do kamery.' },
  ],
};

function CameraMessage({ status }: { status: Exclude<CameraStatus, 'live'> }) {
  const { t } = useI18n();
  const [title, detail] = messages[status];
  const starting = status === 'starting';

  return (
    <div className={css.message} role={starting ? 'status' : 'alert'}>
      {starting ? <CameraIcon aria-hidden='true' /> : <CameraOffIcon aria-hidden='true' />}
      <strong>{t(title)}</strong>
      <span>{t(detail)}</span>
    </div>
  );
}
