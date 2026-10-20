import { SwitchCameraIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { useI18n } from '@/lib/i18n/I18nProvider';
import css from './CameraSwitch.module.css';

type CameraSwitchProps = {
  activeDeviceId: string | undefined;
  onSwitch: (deviceId: string) => void;
};

type Notice = { id: number; long?: boolean; text: string };

const hintSeenStorageKey = 'camera.switchHintSeen';

/**
 * Cycles through the device's cameras, and once tells users with several rear cameras that another
 * one may focus better. Mount it over a live preview: browsers list cameras only after access.
 */
export function CameraSwitch({ activeDeviceId, onSwitch }: CameraSwitchProps) {
  const { t } = useI18n();
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [notice, setNotice] = useState<Notice>();

  useEffect(() => {
    void navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoInputs = devices.filter((device) => device.kind === 'videoinput');
      setCameras(videoInputs);
      const rearCameras = videoInputs.filter((camera) =>
        /back|rear|environment/i.test(camera.label),
      );
      if (rearCameras.length > 1 && !localStorage.getItem(hintSeenStorageKey)) {
        localStorage.setItem(hintSeenStorageKey, '1');
        setNotice({
          id: 0,
          long: true,
          text: t({ en: 'Blurry? Try another camera.', pl: 'Rozmazane? Spróbuj innej kamery.' }),
        });
      }
    });
  }, []);

  if (cameras.length < 2) return null;

  function switchCamera() {
    const index = cameras.findIndex((camera) => camera.deviceId === activeDeviceId);
    const nextIndex = (index + 1) % cameras.length;
    const next = cameras[nextIndex];
    if (!next) return;
    onSwitch(next.deviceId);
    setNotice({
      id: (notice?.id ?? 0) + 1,
      text: t({
        en: `Camera ${nextIndex + 1}/${cameras.length}`,
        pl: `Kamera ${nextIndex + 1}/${cameras.length}`,
      }),
    });
  }

  return (
    <div className={css.cameraSwitch}>
      {notice ? (
        // A new key restarts the CSS fade, so no timer is needed.
        <output className={css.notice} data-long={notice.long ? '' : undefined} key={notice.id}>
          {notice.text}
        </output>
      ) : null}
      <Btn
        aria-label={t({ en: 'Switch camera', pl: 'Przełącz kamerę' })}
        className={css.button}
        icon={<SwitchCameraIcon aria-hidden='true' />}
        iconOnly
        onClick={switchCamera}
        variant='ghost'
      />
    </div>
  );
}
