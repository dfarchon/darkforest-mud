import { PICTURE_URL } from "@df/constants";
import { AvatarType } from "@df/types";
export type Avatar = {
  legacy: boolean;
  topLayer: Array<string>;
  bottomLayer: Array<string>;
  desc: string;
  // image?: () => Promise<HTMLImageElement>;
};

const URL = PICTURE_URL;

// const Picture = {
//   legacy: false,
//   topLayer: [URL + '/img/avatar/Picture.png'],
//   bottomLayer: [],
//   // image: () =>
//   //   new Promise<HTMLImageElement>((resolve) => {
//   //     const img = new Image();
//   //     img.src = 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=025';
//   //     img.onload = () => resolve(img);
//   //   }),
// };

const Cathy = {
  legacy: false,
  topLayer: [URL + "/img/avatar/Cathy.png"],
  bottomLayer: [],
  desc: "",
};

const BaliGee = {
  legacy: false,
  topLayer: [URL + "/img/avatar/BaliGee.png"],
  bottomLayer: [],
  desc: "",
};

const Christine = {
  legacy: false,
  topLayer: [URL + "/img/avatar/Christine.png"],
  bottomLayer: [],
  desc: "",
};

const Ddy = {
  legacy: false,
  topLayer: [URL + "/img/avatar/ddy.png"],
  bottomLayer: [],
  desc: "",
};

const Flicka = {
  legacy: false,
  topLayer: [URL + "/img/avatar/Flicka.png"],
  bottomLayer: [],
  desc: "",
};

const Gink = {
  legacy: false,
  topLayer: [URL + "/img/avatar/gink.png"],
  bottomLayer: [],
  desc: "",
};

const Hope = {
  legacy: false,
  topLayer: [URL + "/img/avatar/Hope.png"],
  bottomLayer: [],
  desc: "",
};

const Modukon = {
  legacy: false,
  topLayer: [URL + "/img/avatar/modukon.png"],
  bottomLayer: [],
  desc: "",
};

const Wesely = {
  legacy: false,
  topLayer: [URL + "/img/avatar/wesely.png"],
  bottomLayer: [],
  desc: "",
};

const Zeroxlau = {
  legacy: false,
  topLayer: [URL + "/img/avatar/0xlau.png"],
  bottomLayer: [],
  desc: "",
};

const Hooks = {
  legacy: false,
  topLayer: [URL + "/img/avatar/hooks.png"],
  bottomLayer: [],
  desc: "",
};

const k1ic = {
  legacy: false,
  topLayer: [URL + "/img/avatar/k1ic.png"],
  bottomLayer: [],
  desc: "",
};

const zknevermore = {
  legacy: false,
  topLayer: [URL + "/img/avatar/zknevermore.png"],
  bottomLayer: [],
  desc: "",
};

const ZOOJOO = {
  legacy: false,
  topLayer: [URL + "/img/avatar/ZOOJOO.png"],
  bottomLayer: [],
  desc: "Traveling in the blockchain universe is the ultimate romance",
};

const ZT = {
  legacy: false,
  topLayer: [URL + "/img/avatar/ZT.png"],
  bottomLayer: [],
  desc: "",
};

const Skoon = {
  legacy: false,
  topLayer: [URL + "/img/avatar/skooh.png"],
  bottomLayer: [],
  desc: "",
};

const MUDAI = {
  legacy: false,
  topLayer: [URL + "/img/avatar/MUDAI.png"],
  bottomLayer: [],
  desc: "",
};

const Xiaoyifu = {
  legacy: false,
  topLayer: [URL + "/img/avatar/xiaoyifu.png"],
  bottomLayer: [],
  desc: "",
};

const Yuppie = {
  legacy: false,
  topLayer: [URL + "/img/avatar/yuppie.png"],
  bottomLayer: [],
  desc: "",
};

const Snow = {
  legacy: false,
  topLayer: [URL + "/img/avatar/snow.png"],
  bottomLayer: [],
  desc: "",
};

const Gubsheep = {
  legacy: false,
  topLayer: [URL + "/img/avatar/gubsheep.png"],
  bottomLayer: [],
  desc: "",
};

const Ivan = {
  legacy: false,
  topLayer: [URL + "/img/avatar/ivan.png"],
  bottomLayer: [],
  desc: "",
};

const biscaryn = {
  legacy: false,
  topLayer: [URL + "/img/avatar/biscaryn.png"],
  bottomLayer: [],
  desc: "",
};

const One470 = {
  legacy: false,
  topLayer: [URL + "/img/avatar/1470.png"],
  bottomLayer: [],
  desc: "",
};

export const avatarFromType = (type: AvatarType): Avatar => avatars[type];

export const avatars: Record<AvatarType, Avatar> = {
  [AvatarType.Cathy]: Cathy,
  [AvatarType.BaliGee]: BaliGee,
  [AvatarType.Christine]: Christine,
  [AvatarType.Ddy]: Ddy,
  [AvatarType.Flicka]: Flicka,
  [AvatarType.Gink]: Gink,
  [AvatarType.Hope]: Hope,
  [AvatarType.Modukon]: Modukon,
  [AvatarType.Wesely]: Wesely,
  [AvatarType.Zeroxlau]: Zeroxlau,
  [AvatarType.Hooks]: Hooks,
  [AvatarType.k1ic]: k1ic,
  [AvatarType.zknevermore]: zknevermore,
  [AvatarType.ZOOJOO]: ZOOJOO,
  [AvatarType.ZT]: ZT,
  [AvatarType.Skoon]: Skoon,
  [AvatarType.MUDAI]: MUDAI,
  [AvatarType.Xiaoyifu]: Xiaoyifu,
  [AvatarType.Yuppie]: Yuppie,
  [AvatarType.Snow]: Snow,
  [AvatarType.Gubsheep]: Gubsheep,
  [AvatarType.Ivan]: Ivan,
  [AvatarType.Biscaryn]: biscaryn,
  [AvatarType.One470]: One470,
};
