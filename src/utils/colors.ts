import { LengthArray, Vector4 } from "./baseTypes";
import { arrayAbs, pickRandomElement } from "./misc";
import Cjs from "colorjs.io";

class Color extends Vector4 {

  setProp = (p: string, n: number): Color => {
    Object.assign(this, {[p]: n})
    return this;
  }

  alpha = (n: number): Color => {
    return this.setProp('a', n)
  }

  r = (n: number): Color => {
    return this.setProp('x', n);
  }
  
  g = (n: number): Color => {
    return this.setProp('y', n);
  }
  
  b = (n: number): Color => {
    return this.setProp('z', n);
  }

  static fromArray(a: LengthArray<number, 4>) {
    return new Color(...a);
  }

  static fromString(s: string) {
    return new Cjs(s).srgb;
  }

  rotate = (l: number, c: number, h: number) => {
    let col = new Cjs({space: "srgb", coords: [this.x, this.y, this.z], alpha: this.a})
    col.lch.l += l;
    col.lch.c += c;
    col.lch.h += h;
    console.log("sRGB:", col.srgb);
    [this.x, this.y, this.z] = arrayAbs(col.srgb);
  }

} ;

class Color2 extends Cjs {
  static fromRGBA(r: number, g: number, b: number, a: number) {
    return new Color2({space: "srgb", coords: [r, g, b], alpha: a});
  }

  static fromArray(a: LengthArray<number, 4>): Color2 {
    return Color2.fromRGBA(...a);
  }

  toArray = (): LengthArray<number, 4> => {
    return [this.srgb[0], this.srgb[1], this.srgb[2], this.alpha]
  }

  rotate = (l: number, c: number, h: number): void => {
    this.lch.l += l;
    this.lch.c += c;
    this.lch.h += h;
  }
}
const Blue = Color2.fromRGBA(0, 0, 1, 0.5);
const BlueViolet = Color2.fromRGBA(0.541, 0.169, 0.886, 0.5);
const Brown = Color2.fromRGBA(0.863, 0.078, 0.235, 0.5);
const Chocolate = Color2.fromRGBA(0.863, 0.078, 0.235, 0.5);
const Crimson = Color2.fromRGBA(0.863, 0.078, 0.235, 0.5);
const Cyan = Color2.fromRGBA(0, 1, 1, 0.5);
const DarkRed = Color2.fromRGBA(0.863, 0.078, 0.235, 0.5);
const DimGray = Color2.fromRGBA(0.663, 0.663, 0.663, 0.5);
const FireBrick = Color2.fromRGBA(0.863, 0.078, 0.235, 0.5);
const Goldenrod = Color2.fromRGBA(0.855, 0.647, 0.125, 0.5);
const Green = Color2.fromRGBA(0, 1, 0, 0.5);
const IndianRed = Color2.fromRGBA(0.804, 0.361, 0.361, 0.5);
const LightCoral = Color2.fromRGBA(0.863, 0.078, 0.235, 0.5);
const Maroon = Color2.fromRGBA(0.863, 0.078, 0.235, 0.5);
const MediumPurple = Color2.fromRGBA(0.58, 0, 0.827, 0.5);
const Orange = Color2.fromRGBA(1, 0.584, 0, 0.5);
const OrangeRed = Color2.fromRGBA(1, 0.549, 0, 0.5);
const Peru = Color2.fromRGBA(0.863, 0.078, 0.235, 0.5);
const Purple = Color2.fromRGBA(0.294, 0, 0.51, 0.5);
const Red = Color2.fromRGBA(1, 0, 0, 0.5);
const RosyBrown = Color2.fromRGBA(0.863, 0.078, 0.235, 0.5);
const SaddleBrown = Color2.fromRGBA(0.863, 0.078, 0.235, 0.5);
const Sienna = Color2.fromRGBA(0.863, 0.078, 0.235, 0.5);
const SkyBlue = Color2.fromRGBA(0, 0.584, 1, 0.5);
const SpringGreen = Color2.fromRGBA(0, 1, 0.749, 0.5);
const WebGray = Color2.fromRGBA(0.502, 0.502, 0.502, 0.5);
const Yellow = Color2.fromRGBA(1, 1, 0, 0.5);
const YellowGreen = Color2.fromRGBA(0.749, 1, 0, 0.5);
const TransparentZero = Color2.fromRGBA(0, 0, 0, 0);
const AllColors = [
  Blue,
  BlueViolet,
  Brown,
  Chocolate,
  Crimson,
  Cyan,
  DarkRed,
  DimGray,
  FireBrick,
  Goldenrod,
  Green,
  IndianRed,
  LightCoral,
  Maroon,
  MediumPurple,
  Orange,
  OrangeRed,
  Peru,
  Purple,
  Red,
  RosyBrown,
  SaddleBrown,
  Sienna,
  SkyBlue,
  SpringGreen,
  WebGray,
  Yellow,
  YellowGreen,
];

const pickRandomColor = (): Color => {
  return pickRandomElement<Color>(AllColors) as Color;
}

const pickRandomColorFromSet = pickRandomElement<Color>;

export {
  Blue,
  BlueViolet,
  Brown,
  Chocolate,
  Crimson,
  Cyan,
  DarkRed,
  DimGray,
  FireBrick,
  Goldenrod,
  Green,
  IndianRed,
  LightCoral,
  Maroon,
  MediumPurple,
  Orange,
  OrangeRed,
  Peru,
  Purple,
  Red,
  RosyBrown,
  SaddleBrown,
  Sienna,
  SkyBlue,
  SpringGreen,
  WebGray,
  Yellow,
  YellowGreen,
  TransparentZero,
  AllColors,
  pickRandomColor,
  pickRandomColorFromSet,
};

export { Color2 as Color }
