import { PICTURE_URL } from "@df/constants";
import { MemeType } from "@df/types";

export type Meme = {
  legacy: boolean;
  topLayer: Array<string>;
  bottomLayer: Array<string>;
  // image?: () => Promise<HTMLImageElement>;
};

const URL = PICTURE_URL;

const doge = {
  legacy: false,
  topLayer: [URL + "/img/meme/doge.png"],
  bottomLayer: [],
  // image: () =>
  //   new Promise<HTMLImageElement>((resolve) => {
  //     const img = new Image();
  //     img.src = 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=025';
  //     img.onload = () => resolve(img);
  //   }),
};

const cat = {
  legacy: false,
  topLayer: [URL + "/img/meme/Cat.png"],
  bottomLayer: [],
};

const chunZhen = {
  legacy: false,
  topLayer: [URL + "/img/meme/chunZhen.png"],
  bottomLayer: [],
};

const iKunBird = {
  legacy: false,
  topLayer: [URL + "/img/meme/iKunBird.png"],
  bottomLayer: [],
};

const mike = {
  legacy: false,
  topLayer: [URL + "/img/meme/mike.png"],
  bottomLayer: [],
};

const panda = {
  legacy: false,
  topLayer: [URL + "/img/meme/panda.png"],
  bottomLayer: [],
};

const pepe = {
  legacy: false,
  topLayer: [URL + "/img/meme/pepe.png"],
  bottomLayer: [],
};

const pigMan = {
  legacy: false,
  topLayer: [URL + "/img/meme/pigMan.png"],
  bottomLayer: [],
};

const robotCat = {
  legacy: false,
  topLayer: [URL + "/img/meme/robotCat.png"],
  bottomLayer: [],
};

const taiKuLa = {
  legacy: false,
  topLayer: [URL + "/img/meme/taiKuLa.png"],
  bottomLayer: [],
};

const wojak1 = {
  legacy: false,
  topLayer: [URL + "/img/meme/wojak1.png"],
  bottomLayer: [],
};

const wojak2 = {
  legacy: false,
  topLayer: [URL + "/img/meme/wojak2.png"],
  bottomLayer: [],
};

const wojak3 = {
  legacy: false,
  topLayer: [URL + "/img/meme/wojak3.png"],
  bottomLayer: [],
};

const wojak4 = {
  legacy: false,
  topLayer: [URL + "/img/meme/wojak4.png"],
  bottomLayer: [],
};

const NyanCat = {
  legacy: false,
  topLayer: [URL + "/img/meme/NyanCat.png"],
  bottomLayer: [],
};

const Harold = {
  legacy: false,
  topLayer: [URL + "/img/meme/Hide_the_Pain_harold.png"],
  bottomLayer: [],
};

const TheMerge = {
  legacy: false,
  topLayer: [URL + "/img/meme/TheMerge.png"],
  bottomLayer: [],
};

const Undream = {
  legacy: false,
  topLayer: [URL + "/img/meme/Undream.png"],
  bottomLayer: [],
};

const KakaiKiki = {
  legacy: false,
  topLayer: [URL + "/img/meme/KaikaiKiki.png"],
  bottomLayer: [],
};

const SuccessfulKid = {
  legacy: false,
  topLayer: [URL + "/img/meme/sucessful-kid.png"],
  bottomLayer: [],
};

const Slerf = {
  legacy: false,
  topLayer: [URL + "/img/meme/slerf.png"],
  bottomLayer: [],
};

export const memeFromType = (type: MemeType): Meme => memes[type];

export const memes: Record<MemeType, Meme> = {
  [MemeType.Doge]: doge,
  [MemeType.Cat]: cat,
  [MemeType.Pepe]: pepe,
  [MemeType.RobotCat]: robotCat,
  [MemeType.Wojak]: wojak3,
  [MemeType.NyanCat]: NyanCat,
  [MemeType.Harold]: Harold,
  [MemeType.Undream]: Undream,
  [MemeType.Slerf]: Slerf,
  [MemeType.ChunZhen]: chunZhen,
  // ==================================================
  // [MemeType.Doge]: doge,
  // [MemeType.Cat]: cat,

  // [MemeType.IKunBird]: iKunBird,
  // [MemeType.Mike]: mike,
  // [MemeType.Panda]: panda,
  // [MemeType.Pepe]: pepe,
  // [MemeType.PigMan]: pigMan,
  // [MemeType.RobotCat]: robotCat,
  // [MemeType.TaiKuLa]: taiKuLa,
  // [MemeType.Wojak1]: wojak1,
  // [MemeType.Wojak2]: wojak2,
  // [MemeType.Wojak3]: wojak3,
  // [MemeType.Wojak4]: wojak4,
  // [MemeType.NyanCat]: NyanCat,
  // [MemeType.Harold]: Harold,
  // [MemeType.TheMerge]: TheMerge,
  // [MemeType.Undream]: Undream,
  // [MemeType.KakaiKiki]: KakaiKiki,
  // [MemeType.SucessfulKid]: SuccessfulKid,
};
