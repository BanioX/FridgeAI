/**
 * Camera set-up for scanning codes up close (ADR-0014). Browsers start with a small picture
 * (often 640×480) and some phones pick a lens that cannot focus near: on iPhone Pro models the
 * default back camera stays blurry at 10 cm. So: ask for a sharp picture, prefer the main lens,
 * zoom in where the browser allows it (the phone can then stay at a distance where it focuses),
 * and keep autofocus running. Every step is optional: what a browser does not offer is skipped.
 */

/** Sharp enough for small EAN-8 codes at 20 cm, still light on the decoder. */
export const VIDEO_SIZE = { width: { ideal: 1920 }, height: { ideal: 1080 } } as const;

/** Moderate zoom: the phone stays far enough away to focus, the code still fills the frame. */
export const TARGET_ZOOM = 2;

const BACK = /back|rear|rück|arrière|posteriore|environment|facing back/i;
const NOT_MAIN = /ultra|tele|front|vorder|selfie|user|dual|triple|macro|depth|tof/i;

/**
 * The main back lens from the cameras the browser lists (labels are only filled in after the
 * permission was granted). iPhone: «Back Camera», not «Back Ultra Wide Camera» or the «Dual» and
 * «Triple» virtual cameras; Android: the first «facing back», usually the main sensor.
 */
export function pickMainBackCamera(devices: readonly MediaDeviceInfo[]): string | undefined {
  return devices.find(
    (device) =>
      device.kind === 'videoinput' &&
      device.deviceId !== '' &&
      BACK.test(device.label) &&
      !NOT_MAIN.test(device.label),
  )?.deviceId;
}

/** What the camera track can do, as far as this browser tells (Chrome yes, Safari partly). */
export interface CameraFeatures {
  zoom?: { min: number; max: number };
  continuousFocus: boolean;
  torch: boolean;
}

interface Range {
  min?: number;
  max?: number;
}

/** Reads the capabilities defensively: they are not in every browser or TypeScript DOM type. */
export function cameraFeatures(track: MediaStreamTrack): CameraFeatures {
  const capabilities = (
    typeof track.getCapabilities === 'function' ? track.getCapabilities() : {}
  ) as Record<string, unknown>;
  const zoom = capabilities.zoom as Range | undefined;
  const focusModes = capabilities.focusMode;
  return {
    ...(zoom?.min !== undefined && zoom.max !== undefined && zoom.max > zoom.min
      ? { zoom: { min: zoom.min, max: zoom.max } }
      : {}),
    continuousFocus: Array.isArray(focusModes) && focusModes.includes('continuous'),
    torch: capabilities.torch === true,
  };
}

/** The zoom to ask for: 2× where possible, never outside what the camera offers. */
export function zoomFor(features: CameraFeatures): number | undefined {
  if (features.zoom === undefined) {
    return undefined;
  }
  return Math.min(features.zoom.max, Math.max(features.zoom.min, TARGET_ZOOM));
}

/** Applies autofocus and zoom one by one, so one refused setting does not undo the other. */
export async function tuneForCodes(track: MediaStreamTrack): Promise<CameraFeatures> {
  const features = cameraFeatures(track);
  const zoom = zoomFor(features);
  const wishes: Record<string, unknown>[] = [
    ...(features.continuousFocus ? [{ focusMode: 'continuous' }] : []),
    ...(zoom === undefined ? [] : [{ zoom }]),
  ];
  for (const wish of wishes) {
    await track.applyConstraints({ advanced: [wish as MediaTrackConstraintSet] }).catch(() => {
      // Not every device accepts every setting; scanning works without it.
    });
  }
  return features;
}

/** Switches the flashlight where the browser supports it (Android Chrome). */
export async function setTorch(track: MediaStreamTrack, on: boolean): Promise<boolean> {
  try {
    await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Opens the back camera for scanning: first any back camera (to get the permission and the
 * labels), then the main lens if that is a different one.
 */
export async function openScanCamera(media: MediaDevices): Promise<MediaStream> {
  const first = await media.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, ...VIDEO_SIZE },
    audio: false,
  });
  const current = first.getVideoTracks()[0]?.getSettings().deviceId;
  const main = pickMainBackCamera(await media.enumerateDevices().catch(() => []));
  if (main === undefined || main === current) {
    return first;
  }
  for (const track of first.getTracks()) {
    track.stop();
  }
  return media
    .getUserMedia({ video: { deviceId: { exact: main }, ...VIDEO_SIZE }, audio: false })
    .catch(() =>
      // The main lens is busy or gone: fall back to what worked before.
      media.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, ...VIDEO_SIZE },
        audio: false,
      }),
    );
}
