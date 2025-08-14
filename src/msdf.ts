export interface CharDescriptor {
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  xoffset: number;
  yoffset: number;
  xadvance: number;
}

export interface MSDFJson {
  chars: CharDescriptor[];
  common: {
    lineHeight: number;
    base: number;
    scaleW: number;
    scaleH: number;
  };
  info: {
    size: number;
  };
}
