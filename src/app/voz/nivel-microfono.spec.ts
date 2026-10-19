import { NivelMicrofono, nivelRms } from './nivel-microfono';

class PistaFalsa {
  detenida = false;
  stop() {
    this.detenida = true;
  }
}

function medioFalso(muestra: number) {
  const pista = new PistaFalsa();
  const stream = { getTracks: () => [pista] };
  let cerrado = false;
  class ContextoFalso {
    createMediaStreamSource() {
      return { connect: () => {} };
    }
    createAnalyser() {
      return {
        fftSize: 0,
        smoothingTimeConstant: 0,
        getFloatTimeDomainData: (datos: Float32Array) => datos.fill(muestra),
      };
    }
    close() {
      cerrado = true;
      return Promise.resolve();
    }
  }
  return { pista, stream, ContextoFalso, cerrado: () => cerrado };
}

describe('nivelRms', () => {
  it('silencio es 0, una señal fuerte se acerca a 1 y nunca pasa de 1', () => {
    expect(nivelRms(new Float32Array(64))).toBe(0);
    expect(nivelRms(new Float32Array(64).fill(0.05))).toBeGreaterThan(0.2);
    expect(nivelRms(new Float32Array(64).fill(1))).toBe(1);
  });
});

describe('NivelMicrofono', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('mide el volumen real del micrófono y lo publica como signal', async () => {
    const f = medioFalso(0.2);
    const getUserMedia = vi.fn(async () => f.stream);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.stubGlobal('AudioContext', f.ContextoFalso);
    let cuadro: FrameRequestCallback = () => {};
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => ((cuadro = cb), 1));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const nivel = new NivelMicrofono();
    await nivel.abrir();
    expect(getUserMedia).toHaveBeenCalledWith({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    cuadro(0);
    expect(nivel.nivel()).toBeGreaterThan(0.5);
    nivel.cerrar();
    expect(f.pista.detenida).toBe(true);
    expect(f.cerrado()).toBe(true);
    expect(nivel.nivel()).toBe(0);
  });

  it('permiso denegado y sin micrófono dan mensajes claros', async () => {
    for (const [nombre, mensaje] of [
      ['NotAllowedError', /permiso/],
      ['NotFoundError', /micrófono/],
    ] as const) {
      vi.stubGlobal('navigator', {
        mediaDevices: { getUserMedia: async () => Promise.reject(new DOMException('x', nombre)) },
      });
      await expect(new NivelMicrofono().abrir()).rejects.toThrow(mensaje);
    }
  });

  it('sin getUserMedia (navegador viejo o página sin https) no rompe: avisa', async () => {
    vi.stubGlobal('navigator', {});
    await expect(new NivelMicrofono().abrir()).rejects.toThrow(/micrófono/);
  });
});
