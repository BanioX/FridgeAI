import { describe, expect, it } from 'vitest';
import { cameraFeatures, pickMainBackCamera, zoomFor } from './camera';

const camera = (deviceId: string, label: string, kind: MediaDeviceKind = 'videoinput') =>
  ({ deviceId, label, kind, groupId: '', toJSON: () => ({}) }) as MediaDeviceInfo;

const track = (capabilities: Record<string, unknown>) =>
  ({ getCapabilities: () => capabilities }) as unknown as MediaStreamTrack;

describe('pickMainBackCamera', () => {
  it('takes the main lens of an iPhone Pro, not ultra wide, telephoto or virtual cameras', () => {
    expect(
      pickMainBackCamera([
        camera('f', 'Front Camera'),
        camera('t', 'Back Triple Camera'),
        camera('d', 'Back Dual Wide Camera'),
        camera('u', 'Back Ultra Wide Camera'),
        camera('m', 'Back Camera'),
        camera('z', 'Back Telephoto Camera'),
        camera('mic', 'iPhone Microphone', 'audioinput'),
      ]),
    ).toBe('m');
  });

  it('understands German and Android labels and the first back sensor', () => {
    expect(
      pickMainBackCamera([camera('v', 'Vorderseitige Kamera'), camera('r', 'Rückkamera')]),
    ).toBe('r');
    expect(
      pickMainBackCamera([
        camera('1', 'camera2 1, facing front'),
        camera('0', 'camera2 0, facing back'),
        camera('2', 'camera2 2, facing back'),
      ]),
    ).toBe('0');
  });

  it('gives up without labels (no permission yet) or without a back camera', () => {
    expect(pickMainBackCamera([camera('a', ''), camera('b', '')])).toBeUndefined();
    expect(pickMainBackCamera([camera('w', 'Integrated Webcam')])).toBeUndefined();
    expect(pickMainBackCamera([camera('', 'Back Camera')])).toBeUndefined();
  });
});

describe('camera features', () => {
  it('reads zoom, continuous focus and torch where the browser tells them', () => {
    const features = cameraFeatures(
      track({ zoom: { min: 1, max: 8 }, focusMode: ['manual', 'continuous'], torch: true }),
    );
    expect(features).toEqual({ zoom: { min: 1, max: 8 }, continuousFocus: true, torch: true });
    expect(zoomFor(features)).toBe(2);
  });

  it('stays within the zoom range and skips what is missing', () => {
    expect(zoomFor(cameraFeatures(track({ zoom: { min: 1, max: 1.5 } })))).toBe(1.5);
    expect(zoomFor(cameraFeatures(track({ zoom: { min: 3, max: 10 } })))).toBe(3);
    expect(cameraFeatures(track({}))).toEqual({ continuousFocus: false, torch: false });
    expect(cameraFeatures({} as MediaStreamTrack)).toEqual({
      continuousFocus: false,
      torch: false,
    });
  });
});
