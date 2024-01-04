import { Vector4 } from "./baseTypes";
import { pickRandomElement } from "./misc";

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
} ;
const Blue = new Color(0, 0, 1, 0.5);
const BlueViolet = new Color(0.541, 0.169, 0.886, 0.5);
const Brown = new Color(0.863, 0.078, 0.235, 0.5);
const Chocolate = new Color(0.863, 0.078, 0.235, 0.5);
const Crimson = new Color(0.863, 0.078, 0.235, 0.5);
const Cyan = new Color(0, 1, 1, 0.5);
const DarkRed = new Color(0.863, 0.078, 0.235, 0.5);
const DimGray = new Color(0.663, 0.663, 0.663, 0.5);
const FireBrick = new Color(0.863, 0.078, 0.235, 0.5);
const Goldenrod = new Color(0.855, 0.647, 0.125, 0.5);
const Green = new Color(0, 1, 0, 0.5);
const IndianRed = new Color(0.804, 0.361, 0.361, 0.5);
const LightCoral = new Color(0.863, 0.078, 0.235, 0.5);
const Maroon = new Color(0.863, 0.078, 0.235, 0.5);
const MediumPurple = new Color(0.58, 0, 0.827, 0.5);
const Orange = new Color(1, 0.584, 0, 0.5);
const OrangeRed = new Color(1, 0.549, 0, 0.5);
const Peru = new Color(0.863, 0.078, 0.235, 0.5);
const Purple = new Color(0.294, 0, 0.51, 0.5);
const Red = new Color(1, 0, 0, 0.5);
const RosyBrown = new Color(0.863, 0.078, 0.235, 0.5);
const SaddleBrown = new Color(0.863, 0.078, 0.235, 0.5);
const Sienna = new Color(0.863, 0.078, 0.235, 0.5);
const SkyBlue = new Color(0, 0.584, 1, 0.5);
const SpringGreen = new Color(0, 1, 0.749, 0.5);
const WebGray = new Color(0.502, 0.502, 0.502, 0.5);
const Yellow = new Color(1, 1, 0, 0.5);
const YellowGreen = new Color(0.749, 1, 0, 0.5);
const TransparentZero = new Color(0, 0, 0, 0);
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

export { Color }
