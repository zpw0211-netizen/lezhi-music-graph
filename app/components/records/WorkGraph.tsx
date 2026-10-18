"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { schemaCategoryFor } from "../../graph-schema";
import { SEMANTIC_PALETTE } from "../../semantic-palette";
import type { SemanticPaletteKey } from "../../semantic-palette";
import { WorkbenchIcon } from "../WorkbenchIcon";
import { EDITION, stripEditionPrefix } from "../../lib/app/books";

type WorkGraphEntity = {
  id: string;
  name: string;
  type: string;
  bookKeys?: string[];
  firstPageByBook?: Record<string, number>;
  degree?: number;
  media?: Array<{ kind: string; url: string; title?: string; source?: string }>;
};
type WorkGraphRelation = {
  id: string;
  subject: string;
  predicate: string;
  label?: string;
  objectId?: string | null;
  literal?: string | null;
  provenance?: boolean;
  extended?: boolean;
  confidence?: number;
  sourcePage?: number | null;
  bookKeys?: string[];
};
type BookInfo = { key: string; title: string };

// 教材谱例图片的真实像素尺寸，均从生成后的 WebP 图片读取；此表与
// app/lib/lesson/score-sizes.ts 分开维护。
// 交给 <img> 的 width/height：按真实宽高预留空间，谱例不再被强制 707/1000
// 拉出大块留白，懒加载也不会撑动布局。缺表项的图退化为无预留（自动量高）。
const SCORE_SIZES: Record<string, readonly [number, number]> = {
  "media/scores/g7s1/10zmksa-1.webp": [1400, 877],
  "media/scores/g7s1/19c09gl-1.webp": [1400, 687],
  "media/scores/g7s1/1d88abw-1.webp": [1400, 1323],
  "media/scores/g7s1/1d8rztk-1.webp": [1400, 1057],
  "media/scores/g7s1/1dfjl5j-1.webp": [1400, 1570],
  "media/scores/g7s1/1dfjl5j-2.webp": [1400, 413],
  "media/scores/g7s1/1fj0ozw-1.webp": [1400, 738],
  "media/scores/g7s1/1fm9r4o-1.webp": [1400, 1671],
  "media/scores/g7s1/1fm9r4o-2.webp": [1400, 1002],
  "media/scores/g7s1/1glv4a8-1.webp": [1400, 321],
  "media/scores/g7s1/1gygqcg-1.webp": [1400, 1679],
  "media/scores/g7s1/1gygqcg-2.webp": [1400, 989],
  "media/scores/g7s1/1h7ubc-1.webp": [1400, 1268],
  "media/scores/g7s1/1hue0k8-1.webp": [1400, 1639],
  "media/scores/g7s1/1k7ceo9-1.webp": [1400, 1048],
  "media/scores/g7s1/1m236zb-1.webp": [1400, 911],
  "media/scores/g7s1/1m236zb-2.webp": [1400, 1947],
  "media/scores/g7s1/1m236zb-3.webp": [1400, 1903],
  "media/scores/g7s1/1sd1zdc-1.webp": [1400, 1668],
  "media/scores/g7s1/1tertv9-1.webp": [1400, 1022],
  "media/scores/g7s1/1u6bqm6-1.webp": [1400, 1675],
  "media/scores/g7s1/1xbn8cy-1.webp": [1400, 965],
  "media/scores/g7s1/1xda221-1.webp": [1400, 720],
  "media/scores/g7s1/49nkcn-1.webp": [1400, 365],
  "media/scores/g7s1/5mntpd-1.webp": [1400, 871],
  "media/scores/g7s1/697bme-1.webp": [1400, 817],
  "media/scores/g7s1/78sqf-1.webp": [1400, 1195],
  "media/scores/g7s1/7uxhk6-1.webp": [1400, 899],
  "media/scores/g7s1/7uxhk6-2.webp": [1400, 973],
  "media/scores/g7s1/9d7rmb-1.webp": [1400, 554],
  "media/scores/g7s1/amsgix-1.webp": [1400, 1680],
  "media/scores/g7s1/amsgix-2.webp": [1400, 1067],
  "media/scores/g7s1/bl59hg-1.webp": [1400, 1154],
  "media/scores/g7s1/dk1xlb-1.webp": [1400, 1615],
  "media/scores/g7s1/dk1xlb-2.webp": [1400, 934],
  "media/scores/g7s1/do0hry-1.webp": [1400, 678],
  "media/scores/g7s1/ehrh3x-1.webp": [1400, 809],
  "media/scores/g7s1/g1jcp5-1.webp": [1400, 474],
  "media/scores/g7s1/gckcnf-1.webp": [1400, 479],
  "media/scores/g7s1/hitjkt-1.webp": [1400, 923],
  "media/scores/g7s1/iyytyu-1.webp": [1400, 1597],
  "media/scores/g7s1/iyytyu-2.webp": [1400, 1950],
  "media/scores/g7s1/kfs91w-1.webp": [1400, 766],
  "media/scores/g7s1/kzxnd-1.webp": [1400, 1086],
  "media/scores/g7s1/kzxnd-2.webp": [1400, 338],
  "media/scores/g7s1/lzo3vg-1.webp": [1400, 1114],
  "media/scores/g7s1/nsquwo-1.webp": [1400, 1056],
  "media/scores/g7s1/pg5wdy-1.webp": [1400, 1253],
  "media/scores/g7s1/qocfri-1.webp": [1400, 1138],
  "media/scores/g7s1/qocfri-2.webp": [1400, 628],
  "media/scores/g7s1/w81z20-1.webp": [1400, 1294],
  "media/scores/g7s1/w81z20-2.webp": [1400, 773],
  "media/scores/g7s1/x3tk01-1.webp": [1400, 1738],
  "media/scores/g7s1/x89eur-1.webp": [1400, 1710],
  "media/scores/g7s1/x89eur-2.webp": [1400, 818],
  "media/scores/g7s1/ym5hef-1.webp": [1400, 285],
  "media/scores/g7s2/1089nqw-1.webp": [1400, 1291],
  "media/scores/g7s2/1089nqw-2.webp": [1400, 1437],
  "media/scores/g7s2/13rm2eq-1.webp": [1400, 736],
  "media/scores/g7s2/13tbiyc-1.webp": [1400, 530],
  "media/scores/g7s2/19pz3sy-1.webp": [1400, 1516],
  "media/scores/g7s2/1dg6qx4-1.webp": [1400, 729],
  "media/scores/g7s2/1dyy1u2-1.webp": [1400, 1463],
  "media/scores/g7s2/1dyy1u2-2.webp": [1400, 529],
  "media/scores/g7s2/1h9meqa-1.webp": [1400, 1579],
  "media/scores/g7s2/1h9meqa-2.webp": [1400, 1076],
  "media/scores/g7s2/1hue0k8-1.webp": [1400, 1632],
  "media/scores/g7s2/1ib68m3-1.webp": [1400, 402],
  "media/scores/g7s2/1l4daba-1.webp": [1400, 1703],
  "media/scores/g7s2/1l4daba-2.webp": [1400, 571],
  "media/scores/g7s2/1lsktbu-1.webp": [1400, 1044],
  "media/scores/g7s2/1m236zb-1.webp": [1400, 1532],
  "media/scores/g7s2/1m236zb-2.webp": [1400, 886],
  "media/scores/g7s2/1oudslj-1.webp": [1400, 790],
  "media/scores/g7s2/1qjudm6-1.webp": [1400, 967],
  "media/scores/g7s2/1r00m9j-1.webp": [1400, 612],
  "media/scores/g7s2/1r00m9j-2.webp": [1400, 1485],
  "media/scores/g7s2/1r4af31-1.webp": [1400, 647],
  "media/scores/g7s2/1t2oi1k-1.webp": [1400, 1004],
  "media/scores/g7s2/1t2oi1k-2.webp": [1400, 1059],
  "media/scores/g7s2/1wlavqf-1.webp": [1400, 1131],
  "media/scores/g7s2/1wlavqf-2.webp": [1400, 386],
  "media/scores/g7s2/6ors1l-1.webp": [1400, 1368],
  "media/scores/g7s2/717rsl-1.webp": [1400, 795],
  "media/scores/g7s2/94k843-1.webp": [1400, 650],
  "media/scores/g7s2/94k843-2.webp": [1400, 436],
  "media/scores/g7s2/boki5u-1.webp": [1400, 1542],
  "media/scores/g7s2/boki5u-2.webp": [1400, 350],
  "media/scores/g7s2/gyvna0-1.webp": [1400, 1160],
  "media/scores/g7s2/gyvna0-2.webp": [1400, 861],
  "media/scores/g7s2/h3ntw3-1.webp": [1400, 702],
  "media/scores/g7s2/i41bac-1.webp": [1400, 1660],
  "media/scores/g7s2/i41bac-2.webp": [1400, 1780],
  "media/scores/g7s2/i41bac-3.webp": [1400, 392],
  "media/scores/g7s2/izfhkt-1.webp": [1400, 581],
  "media/scores/g7s2/l5dwtu-1.webp": [1400, 1356],
  "media/scores/g7s2/l5dwtu-2.webp": [1400, 392],
  "media/scores/g7s2/mo5m3c-1.webp": [1400, 246],
  "media/scores/g7s2/nohy0t-1.webp": [1400, 1071],
  "media/scores/g7s2/nohy0t-2.webp": [1400, 812],
  "media/scores/g7s2/nohy0t-3.webp": [1400, 324],
  "media/scores/g7s2/o3v6lb-1.webp": [1400, 1537],
  "media/scores/g7s2/o3v6lb-2.webp": [1400, 1417],
  "media/scores/g7s2/o7rify-1.webp": [1400, 365],
  "media/scores/g7s2/p9f22h-1.webp": [1400, 1225],
  "media/scores/g7s2/p9f22h-2.webp": [1400, 562],
  "media/scores/g7s2/pz0byl-1.webp": [1400, 782],
  "media/scores/g7s2/pz0byl-2.webp": [1400, 975],
  "media/scores/g7s2/qnmwwo-1.webp": [1400, 1211],
  "media/scores/g7s2/swblh-1.webp": [1400, 1065],
  "media/scores/g7s2/szjzhg-1.webp": [1400, 550],
  "media/scores/g7s2/xfdte9-1.webp": [1400, 1137],
  "media/scores/g7s2/ydns49-1.webp": [1400, 658],
  "media/scores/g8s1/152bl4v-1.webp": [1400, 498],
  "media/scores/g8s1/15lnkb0-1.webp": [914, 1754],
  "media/scores/g8s1/15lnkb0-2.webp": [891, 1368],
  "media/scores/g8s1/15lnkb0-3.webp": [1290, 768],
  "media/scores/g8s1/15lnkb0-4.webp": [1400, 369],
  "media/scores/g8s1/15nlkdb-1.webp": [1400, 726],
  "media/scores/g8s1/15q5znl-1.webp": [1400, 1780],
  "media/scores/g8s1/15q5znl-2.webp": [1400, 427],
  "media/scores/g8s1/19v139-1.webp": [1336, 1163],
  "media/scores/g8s1/1dq275w-1.webp": [1106, 232],
  "media/scores/g8s1/1emnlh2-1.webp": [1400, 803],
  "media/scores/g8s1/1j32ajk-1.webp": [1400, 731],
  "media/scores/g8s1/1jg4if2-1.webp": [884, 195],
  "media/scores/g8s1/1lxf45m-1.webp": [842, 576],
  "media/scores/g8s1/1mvq9al-1.webp": [1400, 979],
  "media/scores/g8s1/1nyb5kb-1.webp": [1400, 561],
  "media/scores/g8s1/1oos48i-1.webp": [1400, 474],
  "media/scores/g8s1/1qzqcw3-1.webp": [1400, 500],
  "media/scores/g8s1/1r4nrbu-1.webp": [1400, 1338],
  "media/scores/g8s1/1s4owty-1.webp": [1351, 747],
  "media/scores/g8s1/1s4owty-2.webp": [1228, 307],
  "media/scores/g8s1/1ux2kkq-1.webp": [1400, 765],
  "media/scores/g8s1/1v40iof-1.webp": [1400, 1239],
  "media/scores/g8s1/1wcuujl-1.webp": [1400, 655],
  "media/scores/g8s1/1wkxw99-1.webp": [1400, 686],
  "media/scores/g8s1/1y4u3r0-1.webp": [1400, 1757],
  "media/scores/g8s1/1ye9783-1.webp": [1400, 870],
  "media/scores/g8s1/2wvxb0-1.webp": [1400, 1618],
  "media/scores/g8s1/3hbdta-1.webp": [1400, 1540],
  "media/scores/g8s1/3hbdta-2.webp": [1400, 853],
  "media/scores/g8s1/3hbdta-3.webp": [1400, 359],
  "media/scores/g8s1/3l9gzz-1.webp": [1400, 1211],
  "media/scores/g8s1/8wavn2-1.webp": [1400, 572],
  "media/scores/g8s1/8wavn2-2.webp": [1400, 684],
  "media/scores/g8s1/8wavn2-3.webp": [1400, 719],
  "media/scores/g8s1/9tvd10-1.webp": [1400, 1637],
  "media/scores/g8s1/afk6qq-1.webp": [1400, 1043],
  "media/scores/g8s1/bjw8vn-1.webp": [1400, 1178],
  "media/scores/g8s1/bjw8vn-2.webp": [1400, 607],
  "media/scores/g8s1/ck2myb-1.webp": [1400, 1600],
  "media/scores/g8s1/ck2myb-2.webp": [1400, 1750],
  "media/scores/g8s1/e0xd93-1.webp": [1400, 684],
  "media/scores/g8s1/ftvg7g-1.webp": [1400, 1367],
  "media/scores/g8s1/i9evem-1.webp": [1400, 1129],
  "media/scores/g8s1/i9evem-2.webp": [1400, 799],
  "media/scores/g8s1/jpudsm-1.webp": [1400, 1740],
  "media/scores/g8s1/jpudsm-2.webp": [1400, 1278],
  "media/scores/g8s1/k56r1x-1.webp": [1400, 376],
  "media/scores/g8s1/qb9hsm-1.webp": [1400, 1448],
  "media/scores/g8s1/v4bgqg-1.webp": [1400, 1436],
  "media/scores/g8s1/w5hpke-1.webp": [768, 879],
  "media/scores/g8s1/w5hpke-2.webp": [1382, 486],
  "media/scores/g8s1/xt20nu-1.webp": [1400, 920],
  "media/scores/g8s2/1azw4zz-1.webp": [1400, 1028],
  "media/scores/g8s2/1d1kgrg-1.webp": [1400, 690],
  "media/scores/g8s2/1e8he6n-1.webp": [1400, 1122],
  "media/scores/g8s2/1e8he6n-2.webp": [1320, 1679],
  "media/scores/g8s2/1h11ckd-1.webp": [1400, 1710],
  "media/scores/g8s2/1h11ckd-2.webp": [1400, 671],
  "media/scores/g8s2/1kdm6mh-1.webp": [1400, 1720],
  "media/scores/g8s2/1kdm6mh-2.webp": [1400, 730],
  "media/scores/g8s2/1nxen1a-1.webp": [1400, 1715],
  "media/scores/g8s2/1nxen1a-2.webp": [1400, 1544],
  "media/scores/g8s2/1nxen1a-3.webp": [1400, 354],
  "media/scores/g8s2/1rz8y4p-1.webp": [1400, 1899],
  "media/scores/g8s2/1y2j1n3-1.webp": [1400, 1297],
  "media/scores/g8s2/1y9js7w-1.webp": [1400, 1082],
  "media/scores/g8s2/1y9js7w-2.webp": [1400, 291],
  "media/scores/g8s2/1ygnutp-1.webp": [1400, 1621],
  "media/scores/g8s2/1ygnutp-2.webp": [1400, 939],
  "media/scores/g8s2/1ygnutp-3.webp": [1400, 319],
  "media/scores/g8s2/1ywyw1y-1.webp": [1400, 950],
  "media/scores/g8s2/2dlsen-1.webp": [1400, 926],
  "media/scores/g8s2/2dlsen-2.webp": [1400, 385],
  "media/scores/g8s2/4psr1j-1.webp": [1400, 939],
  "media/scores/g8s2/6ek4bk-1.webp": [1400, 1547],
  "media/scores/g8s2/6ek4bk-2.webp": [1400, 1289],
  "media/scores/g8s2/6hxqcg-1.webp": [1400, 1542],
  "media/scores/g8s2/afvkek-1.webp": [1400, 964],
  "media/scores/g8s2/ai2j5r-1.webp": [1400, 1055],
  "media/scores/g8s2/aimoss-1.webp": [730, 379],
  "media/scores/g8s2/aimoss-2.webp": [1351, 440],
  "media/scores/g8s2/b9bqfe-1.webp": [1400, 642],
  "media/scores/g8s2/b9bqfe-2.webp": [1400, 873],
  "media/scores/g8s2/fhl87o-1.webp": [1400, 1301],
  "media/scores/g8s2/i1kdsb-1.webp": [1400, 1028],
  "media/scores/g8s2/lmmg6e-1.webp": [1400, 866],
  "media/scores/g8s2/ncdwe-1.webp": [1400, 1067],
  "media/scores/g8s2/o4kk7o-1.webp": [1400, 887],
  "media/scores/g8s2/o4kk7o-2.webp": [1400, 524],
  "media/scores/g8s2/o4kk7o-3.webp": [1400, 273],
  "media/scores/g8s2/q1czbs-1.webp": [1400, 1345],
  "media/scores/g8s2/rkjs0e-1.webp": [1400, 879],
  "media/scores/g8s2/sjq0lj-1.webp": [1400, 1401],
  "media/scores/g8s2/sjq0lj-2.webp": [1400, 1103],
  "media/scores/g8s2/souu5j-1.webp": [1400, 1234],
  "media/scores/g8s2/souu5j-2.webp": [1400, 499],
  "media/scores/g8s2/souu5j-3.webp": [1400, 1073],
  "media/scores/g8s2/uorfwr-1.webp": [1400, 1621],
  "media/scores/g8s2/uorfwr-2.webp": [1400, 375],
  "media/scores/g8s2/uwl28d-1.webp": [1400, 1237],
  "media/scores/g8s2/vtog5y-1.webp": [1400, 1433],
  "media/scores/g8s2/vtog5y-2.webp": [1400, 600],
  "media/scores/g8s2/w6rr6h-1.webp": [1400, 588],
  "media/scores/g8s2/xohd2e-1.webp": [1400, 655],
  "media/scores/g8s2/y5i8a2-1.webp": [1400, 1448],
  "media/scores/g8s2/y5i8a2-2.webp": [1400, 385],
  "media/scores/g8s2/y5i8a2-3.webp": [1400, 357],
  "media/scores/g8s2/y74gcj-1.webp": [1400, 947],
  "media/scores/g9s1/1126zdl-1.webp": [1400, 641],
  "media/scores/g9s1/17krjci-1.webp": [1400, 1657],
  "media/scores/g9s1/17krjci-2.webp": [1400, 1801],
  "media/scores/g9s1/185kaan-1.webp": [1400, 846],
  "media/scores/g9s1/1cxyrac-1.webp": [1400, 1484],
  "media/scores/g9s1/1cxyrac-2.webp": [1400, 1640],
  "media/scores/g9s1/1cxyrac-3.webp": [1400, 897],
  "media/scores/g9s1/1g2d95g-1.webp": [1400, 943],
  "media/scores/g9s1/1kfa5f1-1.webp": [1400, 1569],
  "media/scores/g9s1/1kfa5f1-2.webp": [1354, 655],
  "media/scores/g9s1/1kybgl7-1.webp": [1400, 1243],
  "media/scores/g9s1/1mgsjuz-1.webp": [1400, 1302],
  "media/scores/g9s1/1mgsjuz-2.webp": [1400, 448],
  "media/scores/g9s1/1mgsjuz-3.webp": [1400, 703],
  "media/scores/g9s1/1okq99v-1.webp": [1400, 908],
  "media/scores/g9s1/1om0lxp-1.webp": [1400, 1074],
  "media/scores/g9s1/1om0lxp-2.webp": [1400, 196],
  "media/scores/g9s1/1plyw96-1.webp": [1400, 472],
  "media/scores/g9s1/1te23yb-1.webp": [1400, 1469],
  "media/scores/g9s1/1te23yb-2.webp": [1400, 286],
  "media/scores/g9s1/1u832kk-1.webp": [1400, 583],
  "media/scores/g9s1/1wo87el-1.webp": [1400, 1179],
  "media/scores/g9s1/1wo87el-2.webp": [768, 776],
  "media/scores/g9s1/1x9ksaq-1.webp": [1400, 1652],
  "media/scores/g9s1/1x9ksaq-2.webp": [1183, 235],
  "media/scores/g9s1/32isvw-1.webp": [1400, 1680],
  "media/scores/g9s1/32isvw-2.webp": [1400, 443],
  "media/scores/g9s1/32isvw-3.webp": [1400, 340],
  "media/scores/g9s1/3ko415-1.webp": [1400, 953],
  "media/scores/g9s1/462jm4-1.webp": [1400, 351],
  "media/scores/g9s1/afsjlm-1.webp": [1400, 1442],
  "media/scores/g9s1/afsjlm-2.webp": [1400, 759],
  "media/scores/g9s1/agyuxs-1.webp": [1400, 416],
  "media/scores/g9s1/b5nn67-1.webp": [1400, 1117],
  "media/scores/g9s1/b5nn67-2.webp": [1400, 621],
  "media/scores/g9s1/d5z37h-1.webp": [1382, 378],
  "media/scores/g9s1/l3mjbg-1.webp": [1400, 1443],
  "media/scores/g9s1/l3mjbg-2.webp": [1400, 613],
  "media/scores/g9s1/l3mjbg-3.webp": [921, 448],
  "media/scores/g9s1/l849f2-1.webp": [1400, 880],
  "media/scores/g9s1/mizxg9-1.webp": [1400, 1151],
  "media/scores/g9s1/mizxg9-2.webp": [1400, 591],
  "media/scores/g9s1/mkrph8-1.webp": [1400, 580],
  "media/scores/g9s1/mkrph8-2.webp": [1400, 1640],
  "media/scores/g9s1/rky0m3-1.webp": [1400, 809],
  "media/scores/g9s1/v293yb-1.webp": [1400, 1066],
  "media/scores/g9s1/vi5fkv-1.webp": [1400, 1628],
  "media/scores/g9s1/wgglre-1.webp": [1400, 1274],
  "media/scores/g9s2/10otulw-1.webp": [1400, 1467],
  "media/scores/g9s2/10otulw-2.webp": [1400, 290],
  "media/scores/g9s2/10otulw-3.webp": [1400, 845],
  "media/scores/g9s2/11uybsn-1.webp": [1400, 1148],
  "media/scores/g9s2/14tipvv-1.webp": [1400, 375],
  "media/scores/g9s2/18yybqd-1.webp": [1400, 1349],
  "media/scores/g9s2/18yybqd-2.webp": [1400, 1618],
  "media/scores/g9s2/196jib0-1.webp": [1400, 1263],
  "media/scores/g9s2/1bwjbtp-1.webp": [1400, 766],
  "media/scores/g9s2/1dhcneu-1.webp": [1400, 759],
  "media/scores/g9s2/1dvpccd-1.webp": [1400, 1060],
  "media/scores/g9s2/1dvpccd-2.webp": [1400, 1445],
  "media/scores/g9s2/1ezqh6n-1.webp": [1336, 563],
  "media/scores/g9s2/1gpt91p-1.webp": [1400, 1062],
  "media/scores/g9s2/1hs877r-1.webp": [1400, 1314],
  "media/scores/g9s2/1kiw09w-1.webp": [1400, 1335],
  "media/scores/g9s2/1kiw09w-2.webp": [1400, 592],
  "media/scores/g9s2/1kl0md8-1.webp": [1400, 1446],
  "media/scores/g9s2/1l7fy4l-1.webp": [1400, 1432],
  "media/scores/g9s2/1nhamkp-1.webp": [1400, 652],
  "media/scores/g9s2/1o1zdhb-1.webp": [1400, 940],
  "media/scores/g9s2/1pxkdrk-1.webp": [1400, 1530],
  "media/scores/g9s2/1pxkdrk-2.webp": [1400, 317],
  "media/scores/g9s2/1skpfsp-1.webp": [1400, 717],
  "media/scores/g9s2/1wde66k-1.webp": [1400, 932],
  "media/scores/g9s2/3ci3t1-1.webp": [1400, 948],
  "media/scores/g9s2/3zzlix-1.webp": [1400, 532],
  "media/scores/g9s2/3zzlix-2.webp": [1400, 386],
  "media/scores/g9s2/591e4z-1.webp": [1400, 1802],
  "media/scores/g9s2/591e4z-2.webp": [1400, 420],
  "media/scores/g9s2/6w5cqr-1.webp": [1400, 1517],
  "media/scores/g9s2/6w5cqr-2.webp": [1400, 1283],
  "media/scores/g9s2/6w5cqr-3.webp": [1400, 741],
  "media/scores/g9s2/72x2g1-1.webp": [1400, 1356],
  "media/scores/g9s2/9ltpbl-1.webp": [1400, 1858],
  "media/scores/g9s2/9ltpbl-2.webp": [1400, 1930],
  "media/scores/g9s2/9ltpbl-3.webp": [1400, 2040],
  "media/scores/g9s2/9ltpbl-4.webp": [1400, 1533],
  "media/scores/g9s2/avjpep-1.webp": [1400, 1019],
  "media/scores/g9s2/az06hb-1.webp": [1400, 951],
  "media/scores/g9s2/eimbeu-1.webp": [1382, 362],
  "media/scores/g9s2/i5sl18-1.webp": [1400, 683],
  "media/scores/g9s2/jtktsa-1.webp": [1400, 495],
  "media/scores/g9s2/jtktsa-2.webp": [1400, 424],
  "media/scores/g9s2/lsoxpa-1.webp": [1400, 1638],
  "media/scores/g9s2/lsoxpa-2.webp": [1400, 1517],
  "media/scores/g9s2/ocynr8-1.webp": [1400, 727],
  "media/scores/g9s2/pz1glm-1.webp": [1400, 1526],
  "media/scores/g9s2/sayc0x-1.webp": [1400, 1053],
  "media/scores/pep-g1s1/13tabwg-1.webp": [1400, 759],
  "media/scores/pep-g1s1/1fy1emq-1.webp": [1400, 805],
  "media/scores/pep-g1s1/1hue0k8-1.webp": [1400, 1610],
  "media/scores/pep-g1s1/1jtaz8c-1.webp": [1400, 1105],
  "media/scores/pep-g1s1/1xjev1u-1.webp": [1400, 1082],
  "media/scores/pep-g1s1/1xlfdqt-1.webp": [1400, 1104],
  "media/scores/pep-g1s1/1xlfdqt-2.webp": [1400, 439],
  "media/scores/pep-g1s1/31rdmr-1.webp": [1400, 1219],
  "media/scores/pep-g1s1/4jcj1w-1.webp": [1400, 683],
  "media/scores/pep-g1s1/cmsp2b-1.webp": [1400, 1312],
  "media/scores/pep-g1s1/g4wgl8-1.webp": [1400, 805],
  "media/scores/pep-g1s1/nc5rzd-1.webp": [1400, 1312],
  "media/scores/pep-g1s1/xlqqde-1.webp": [1400, 1082],
  "media/scores/pep-g1s1/yq2b9e-1.webp": [1400, 1197],
  "media/scores/pep-g1s2/1176hlu-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/1646qxm-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/18bla1a-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/18q1vvh-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/19cxqfj-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/1c1aj68-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/1hs877r-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/1mmw8jb-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/1tzdt5q-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/1ygw42m-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/1yq738e-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/6yvkq3-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/jj62m3-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/kzxnd-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/lijrss-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/mqwldv-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/qocfri-1.webp": [1400, 1946],
  "media/scores/pep-g1s2/znft7n-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/113k8bc-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/12v3jhm-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/15uiagx-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/17rneyv-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/1d1kgrg-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/1dyy1u2-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/1plrmqr-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/1pmzqk5-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/1q32qwm-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/1r4nrbu-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/1r5inx9-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/1w2ps20-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/1wo87el-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/1xqznte-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/azh56b-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/gs6ys4-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/jua3xk-1.webp": [1400, 1946],
  "media/scores/pep-g2s1/pjvjof-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/118diaj-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/16tos8r-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/18lgw93-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/18t5at3-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/18yybqd-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/1cxyrac-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/1hd1fwr-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/1lau57g-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/1u3p55j-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/1v66sbv-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/1y918jk-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/1yveqk9-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/52sp1h-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/dk1xlb-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/hadg0d-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/i0jpu1-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/mkrph8-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/q121mm-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/q1czbs-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/r6tsk0-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/vi5fkv-1.webp": [1400, 1946],
  "media/scores/pep-g2s2/yt4pp5-1.webp": [1400, 1946],
  "media/scores/pep-g3s1/1dhcneu-1.webp": [1400, 1946],
  "media/scores/pep-g3s1/1dyy1u2-1.webp": [1400, 1946],
  "media/scores/pep-g3s1/1j7xuyw-1.webp": [1400, 1946],
  "media/scores/pep-g3s1/1l5mpwg-1.webp": [1400, 1946],
  "media/scores/pep-g3s1/1m5eicq-1.webp": [1400, 1946],
  "media/scores/pep-g3s1/1qpu6bm-1.webp": [1400, 1946],
  "media/scores/pep-g3s1/1thoyut-1.webp": [1400, 1946],
  "media/scores/pep-g3s1/2d74jy-1.webp": [1400, 1946],
  "media/scores/pep-g3s1/411z3o-1.webp": [1400, 1946],
  "media/scores/pep-g3s1/6hxqcg-1.webp": [1400, 1946],
  "media/scores/pep-g3s1/93zvyg-1.webp": [1400, 1946],
  "media/scores/pep-g3s1/tn43us-1.webp": [1400, 1946],
  "media/scores/pep-g3s1/xt20nu-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/15xcwzr-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/1cynlsy-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/1fflrbw-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/1gygqcg-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/1kfa5f1-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/1o2uvy1-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/1pqvj1p-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/1u6bqm6-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/58baqs-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/735khn-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/dr4mph-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/i82w26-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/uvd8zs-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/w2fy96-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/w2ozna-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/whyeb9-1.webp": [1400, 1946],
  "media/scores/pep-g3s2/ym5hef-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/15o8509-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/15zobj3-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/199gpcg-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/1agvj8l-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/1ebjkys-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/1qepaxr-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/1weofu0-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/1xlfdqt-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/1z0uc15-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/3fpd4i-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/94k843-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/kimz7s-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/nohy0t-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/sjq0lj-1.webp": [1400, 1946],
  "media/scores/pep-g4s1/vi5fkv-1.webp": [1400, 1946],
  "media/scores/pep-g5s1/14csgvd-1.webp": [1400, 1946],
  "media/scores/pep-g5s1/15athkd-1.webp": [1400, 1946],
  "media/scores/pep-g5s1/19gktzf-1.webp": [1400, 1946],
  "media/scores/pep-g5s1/1ezgya4-1.webp": [1400, 1946],
  "media/scores/pep-g5s1/1gk0t2t-1.webp": [1400, 1946],
  "media/scores/pep-g5s1/1heu19x-1.webp": [1400, 1946],
  "media/scores/pep-g5s1/1ii6foa-1.webp": [1400, 1946],
  "media/scores/pep-g5s1/1y4u3r0-1.webp": [1400, 1946],
  "media/scores/pep-g5s1/20ccno-1.webp": [1400, 1946],
  "media/scores/pep-g5s1/aeq7ne-1.webp": [1400, 1946],
  "media/scores/pep-g5s1/plfij1-1.webp": [1400, 1946],
  "media/scores/pep-g5s1/pvcvmj-1.webp": [1400, 1946],
  "media/scores/pep-g5s1/twv2t-1.webp": [1400, 1946],
  "media/scores/pep-g5s1/uxbbk7-1.webp": [1400, 1946],
  "media/scores/pep-g6s1/1dfpap-1.webp": [1400, 1946],
  "media/scores/pep-g6s1/1vzhhg3-1.webp": [1400, 1946],
  "media/scores/pep-g6s1/gd43lf-1.webp": [1400, 1946],
  "media/scores/pep-g6s1/lrl8dg-1.webp": [1400, 1946],
  "media/scores/pep-g6s1/lsoxpa-1.webp": [1400, 1946],
  "media/scores/pep-g6s1/mv61jt-1.webp": [1400, 1946],
  "media/scores/pep-g6s1/qnmwwo-1.webp": [1400, 1946],
  "media/scores/pep-g7s1/11uybsn-1.webp": [1400, 1946],
  "media/scores/pep-g7s1/15q5znl-1.webp": [1400, 1946],
  "media/scores/pep-g7s1/1g2d95g-1.webp": [1400, 1946],
  "media/scores/pep-g7s1/1hue0k8-1.webp": [1400, 1946],
  "media/scores/pep-g7s1/1u6bqm6-1.webp": [1400, 1946],
  "media/scores/pep-g7s1/72x2g1-1.webp": [1400, 1946],
  "media/scores/pep-g7s1/dk1xlb-1.webp": [1400, 1946],
  "media/scores/pep-g7s1/pz1glm-1.webp": [1400, 1946],
  "media/scores/pep-g7s1/xt20nu-1.webp": [1400, 1946],
  "media/scores/pep-g7s2/1u6bqm6-1.webp": [1400, 1946],
  "media/scores/pep-g7s2/bjw8vn-1.webp": [1400, 1946],
  "media/scores/pep-g7s2/mkrph8-1.webp": [1400, 1946],
  "media/scores/pep-g7s2/sjq0lj-1.webp": [1400, 1946],
  "media/scores/pep-g7s2/uorfwr-1.webp": [1400, 1946],
  "media/scores/pep-g8s1/15q5znl-1.webp": [1400, 1946],
  "media/scores/pep-g8s1/19c09gl-1.webp": [1400, 1946],
  "media/scores/pep-g8s1/1nxen1a-1.webp": [1400, 1946],
  "media/scores/pep-g8s1/1pcpruj-1.webp": [1400, 1946],
  "media/scores/pep-g8s1/1vwey11-1.webp": [1400, 1946],
  "media/scores/pep-g8s1/3ko415-1.webp": [1400, 1946],
  "media/scores/pep-g8s1/8wavn2-1.webp": [1400, 1946],
  "media/scores/pep-g8s1/fqjq2r-1.webp": [1400, 1946],
  "media/scores/pep-g8s1/gs6ys4-1.webp": [1400, 1946],
  "media/scores/pep-g8s1/mkrph8-1.webp": [1400, 1946],
  "media/scores/pep-g8s1/nohy0t-1.webp": [1400, 1946],
  "media/scores/pep-g8s1/q1czbs-1.webp": [1400, 1946],
  "media/scores/pep-g8s2/18yybqd-1.webp": [1400, 1946],
  "media/scores/pep-g8s2/1kl0md8-1.webp": [1400, 1946],
  "media/scores/pep-g8s2/afk6qq-1.webp": [1400, 1946],
  "media/scores/pep-g8s2/ck2myb-1.webp": [1400, 1946],
  "media/scores/pep-g8s2/e1pstj-1.webp": [1400, 1946],
  "media/scores/pep-g8s2/eejhfd-1.webp": [1400, 1946],
  "media/scores/pep-g8s2/mkrph8-1.webp": [1400, 1946],
  "media/scores/pep-g8s2/qb9hsm-1.webp": [1400, 1946],
  "media/scores/pep-g9s1/1lvhmdp-1.webp": [1400, 1946],
  "media/scores/pep-g9s1/40f8py-1.webp": [1400, 1946],
  "media/scores/pep-g9s1/ezz7c3-1.webp": [1400, 1946],
  "media/scores/pep-g9s1/lzo3vg-1.webp": [1400, 1946],

};

const FACETS: Array<{ key: string; label: string; categories: SemanticPaletteKey[] }> = [
  { key: "creator", label: "创作者", categories: ["person"] },
  { key: "music", label: "音乐要素", categories: ["element", "theory"] },
  { key: "form", label: "体裁与表演", categories: ["genre", "instrument"] },
  { key: "culture", label: "文化背景", categories: ["culture"] },
  { key: "works", label: "关联作品", categories: ["work"] },
  { key: "textbook", label: "教材单元", categories: ["textbook", "activity", "goal"] },
];
const facetOf = (category: SemanticPaletteKey) => FACETS.find((facet) => facet.categories.includes(category))?.key ?? "music";
// Second-hop works are reached only through specific, low-degree neighbours
// (a composer, a source opera); hubs like 2/4 would pull in half the library.
const BRIDGE_CATEGORIES = new Set<SemanticPaletteKey>(["person", "genre", "work"]);
const MAX_BRIDGE_DEGREE = 14;
const MAX_SECOND_HOP = 8;
const LEARNING = /学习|演唱要求|演奏要求|演唱提示|教材标注|练习/;

type EgoNode = {
  id: string;
  entity: WorkGraphEntity;
  category: SemanticPaletteKey;
  depth: 0 | 1 | 2;
  facet: string;
  parent?: string;
  labels: string[];
};
type EgoLink = { id: string; source: string; target: string; labels: string[]; depth: 1 | 2 };
type SimNode = { x: number; y: number; vx: number; vy: number; r: number; w: number; h: number; fx?: number; fy?: number; phase: number };
type RenderNode = { x: number; y: number; r: number };
// Rendered label length drives the collision box, so neighbours never overprint.
// (depth-2 labels render at 12px, depth-1 at 12.5px per char.)
const labelText = (name: string, depth: number) => name.length > (depth === 2 ? 9 : 14) ? `${name.slice(0, depth === 2 ? 8 : 13)}…` : name;
const LABEL_CHAR_WIDTH = (depth: number) => depth === 2 ? 12 : 12.5;

function buildEgo(workId: string, entities: Map<string, WorkGraphEntity>, relationships: WorkGraphRelation[]) {
  const nodes = new Map<string, EgoNode>();
  const links = new Map<string, EgoLink>();
  const work = entities.get(workId);
  if (!work) return { nodes: [], links: [] };
  nodes.set(workId, { id: workId, entity: work, category: "work", depth: 0, facet: "center", labels: [] });
  const adjacency = new Map<string, WorkGraphRelation[]>();
  for (const relation of relationships) {
    if (relation.provenance || !relation.objectId) continue;
    for (const end of [relation.subject, relation.objectId]) {
      if (!adjacency.has(end)) adjacency.set(end, []);
      adjacency.get(end)!.push(relation);
    }
  }
  const labelOf = (relation: WorkGraphRelation) => relation.label ?? relation.predicate;
  const link = (source: string, target: string, label: string, depth: 1 | 2) => {
    const key = [source, target].sort().join("|");
    const existing = links.get(key);
    if (existing) { if (!existing.labels.includes(label)) existing.labels.push(label); return; }
    links.set(key, { id: key, source, target, labels: [label], depth });
  };
  for (const relation of adjacency.get(workId) ?? []) {
    const other = relation.subject === workId ? relation.objectId! : relation.subject;
    const entity = entities.get(other);
    if (!entity || other === workId) continue;
    const category = schemaCategoryFor(entity.type) as SemanticPaletteKey;
    const node = nodes.get(other) ?? { id: other, entity, category, depth: 1 as const, facet: facetOf(category), labels: [] };
    if (!node.labels.includes(labelOf(relation))) node.labels.push(labelOf(relation));
    nodes.set(other, node);
    link(workId, other, labelOf(relation), 1);
  }
  let added = 0;
  const firstHop = [...nodes.values()].filter((node) => node.depth === 1 && BRIDGE_CATEGORIES.has(node.category) && (node.entity.degree ?? 99) <= MAX_BRIDGE_DEGREE);
  for (const bridge of firstHop) {
    let perBridge = 0;
    for (const relation of adjacency.get(bridge.id) ?? []) {
      if (added >= MAX_SECOND_HOP || perBridge >= 3) break;
      const other = relation.subject === bridge.id ? relation.objectId! : relation.subject;
      const entity = entities.get(other);
      if (!entity || nodes.has(other) || schemaCategoryFor(entity.type) !== "work") continue;
      nodes.set(other, { id: other, entity, category: "work", depth: 2, facet: bridge.facet, parent: bridge.id, labels: [labelOf(relation)] });
      link(bridge.id, other, labelOf(relation), 2);
      added += 1; perBridge += 1;
    }
  }
  return { nodes: [...nodes.values()], links: [...links.values()] };
}

const layerOf = (relation: WorkGraphRelation) =>
  relation.extended ? "拓展" : relation.confidence != null && relation.confidence < 0.95 ? "归纳" : relation.confidence != null && relation.confidence < 0.98 ? "乐谱" : "";

/** Focused, living knowledge graph of a single work: the work, its direct
 * knowledge points grouped by facet, and works reachable through them. */
export function WorkGraph({
  workId, entities, relationships, books, assetUrl, onBack, onOpenWork, onLocate,
}: {
  workId: string;
  entities: WorkGraphEntity[];
  relationships: WorkGraphRelation[];
  books: BookInfo[];
  assetUrl: (path: string) => string;
  onBack: () => void;
  onOpenWork: (id: string) => void;
  onLocate: (id: string) => void;
}) {
  const entityMap = useMemo(() => new Map(entities.map((entity) => [entity.id, entity])), [entities]);
  const [showSecond, setShowSecond] = useState(false);
  const ego = useMemo(() => buildEgo(workId, entityMap, relationships), [workId, entityMap, relationships]);
  const nodes = useMemo(() => ego.nodes.filter((node) => showSecond || node.depth < 2), [ego, showSecond]);
  const links = useMemo(() => ego.links.filter((link) => showSecond || link.depth < 2), [ego, showSecond]);
  const work = entityMap.get(workId);
  const attributes = useMemo(() => relationships.filter((relation) => relation.subject === workId && relation.literal && !relation.provenance), [relationships, workId]);
  const [selection, setSelection] = useState<{ workId: string; id: string | null }>(() => ({ workId, id: null }));
  if (selection.workId !== workId) setSelection({ workId, id: null });
  const selectedId = selection.id;
  const setSelectedId = (id: string | null) => setSelection({ workId, id });
  const toggleSelectedId = (id: string) => setSelection((current) => ({
    workId,
    id: current.workId === workId && current.id === id ? null : id,
  }));
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 900, height: 620 });
  const [renderNodes, setRenderNodes] = useState<Map<string, RenderNode>>(() => new Map());
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const sim = useRef(new Map<string, SimNode>());
  const alpha = useRef(1);
  const drag = useRef<{ id: string; moved: boolean; x: number; y: number } | null>(null);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: Math.max(360, entry.contentRect.width), height: Math.max(420, entry.contentRect.height) }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Facet sectors around the work, sized by how many knowledge points each holds.
  const facetAngles = useMemo(() => {
    const present = FACETS.map((facet) => ({ facet, count: nodes.filter((node) => node.depth === 1 && node.facet === facet.key).length })).filter((item) => item.count);
    const total = present.reduce((sum, item) => sum + Math.max(1.6, item.count), 0);
    const start = -Math.PI / 2 - (Math.max(1.6, present[0]?.count ?? 1) / Math.max(1, total)) * Math.PI;
    return new Map(present.map((item, index) => {
      const previousWeight = present.slice(0, index).reduce((sum, previous) => sum + Math.max(1.6, previous.count), 0);
      const cursor = start + (previousWeight / Math.max(1, total)) * Math.PI * 2;
      const span = (Math.max(1.6, item.count) / Math.max(1, total)) * Math.PI * 2;
      const sector = { start: cursor, span, mid: cursor + span / 2 };
      return [item.facet.key, sector] as const;
    }));
  }, [nodes]);
  // The ring is an ellipse that fits the stage: wide screens spread sideways.
  const ringX = Math.max(150, Math.min(size.width * 0.36, 290));
  const ringY = Math.max(130, Math.min((size.height - 150) * 0.42, 230));
  const firstRadius = Math.min(ringX, ringY);

  useEffect(() => {
    const next = new Map<string, SimNode>();
    for (const node of nodes) {
      const previous = sim.current.get(node.id);
      const r = node.depth === 0 ? 30 : node.depth === 1 ? 13 + Math.min(6, Math.log2((node.entity.degree ?? 1) + 1)) : 9;
      const w = Math.max(r * 2, labelText(node.entity.name, node.depth).length * LABEL_CHAR_WIDTH(node.depth) + 8);
      const h = r * 2 + 22;
      next.set(node.id, previous ? { ...previous, r, w, h } : { x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20, vx: 0, vy: 0, r, w, h, phase: Math.random() * Math.PI * 2 });
    }
    sim.current = next;
    alpha.current = 1;
  }, [nodes]);

  useEffect(() => { alpha.current = Math.max(alpha.current, 0.3); }, [size]);
  useEffect(() => {
    let raf = 0;
    let wasMoving = true;
    const byFacet = new Map<string, EgoNode[]>();
    for (const node of nodes) if (node.depth === 1) byFacet.set(node.facet, [...(byFacet.get(node.facet) ?? []), node]);
    const childrenOf = new Map<string, EgoNode[]>();
    for (const node of nodes) if (node.parent) childrenOf.set(node.parent, [...(childrenOf.get(node.parent) ?? []), node]);
    const step = () => {
      const a = alpha.current;
      let moving = a > 0.004 || Boolean(drag.current);
      const hadMotion = wasMoving;
      {
        const list = nodes.map((node) => ({ node, s: sim.current.get(node.id)! })).filter((item) => item.s);
        // Anchors: each first-hop node gets a slot inside its facet's sector.
        for (const { node, s } of list) {
          let tx = 0, ty = 0, k = 0.1;
          if (node.depth === 1) {
            const peers = byFacet.get(node.facet) ?? [node];
            const index = peers.indexOf(node);
            const sector = facetAngles.get(node.facet) ?? { start: 0, span: Math.PI * 2, mid: 0 };
            const angle = sector.start + ((index + 0.5) / peers.length) * sector.span;
            // Crowded sectors alternate between two rings so labels do not collide.
            const crowded = (sector.span / peers.length) * firstRadius < 92;
            const scale = crowded ? (index % 2 ? 1.18 : 0.84) : 1;
            tx = Math.cos(angle) * ringX * scale; ty = Math.sin(angle) * ringY * scale;
          } else if (node.depth === 2 && node.parent) {
            const parent = sim.current.get(node.parent);
            if (!parent) continue;
            const siblings = childrenOf.get(node.parent) ?? [node];
            const base = Math.atan2(parent.y, parent.x);
            const angle = base + (siblings.length > 1 ? (siblings.indexOf(node) / (siblings.length - 1) - 0.5) * Math.min(2.2, 0.7 * siblings.length) : 0);
            tx = parent.x + Math.cos(angle) * 112; ty = parent.y + Math.sin(angle) * 112; k = 0.08;
          } else { k = 0.2; }
          if (a > 0.004) { s.vx += (tx - s.x) * k * a; s.vy += (ty - s.y) * k * a; }
        }
        // Collision keeps labels readable.
        for (let i = 0; i < list.length; i += 1)
          for (let j = i + 1; j < list.length; j += 1) {
            const p = list[i].s, q = list[j].s;
            const dx = q.x - p.x, dy = q.y - p.y;
            const overlapX = (p.w + q.w) / 2 + 6 - Math.abs(dx);
            const overlapY = (p.h + q.h) / 2 + 4 - Math.abs(dy);
            if (overlapX <= 0 || overlapY <= 0) continue;
            // Separate along the axis that needs the smaller move.
            // Collisions resolve even after the layout cools, so nothing is left overprinted.
            const strength = 0.3;
            moving = true;
            const fixedP = list[i].node.depth === 0, fixedQ = list[j].node.depth === 0;
            const share = fixedP || fixedQ ? 1 : 0.5;
            const [mx, my] = overlapX < overlapY ? [Math.sign(dx || 1) * overlapX * strength, 0] : [0, Math.sign(dy || 1) * overlapY * strength];
            if (!fixedP) { p.vx -= mx * share; p.vy -= my * share; }
            if (!fixedQ) { q.vx += mx * share; q.vy += my * share; }
          }
        // Keep every node and its label inside the stage, clear of the toolbar and legend.
        const halfW = size.width / 2, halfH = size.height / 2;
        for (const { node, s } of list) {
          if (node.depth === 0) { s.x = 0; s.y = 0; s.vx = s.vy = 0; continue; }
          if (s.fx != null && s.fy != null) { s.x = s.fx; s.y = s.fy; s.vx = s.vy = 0; continue; }
          s.vx *= 0.72; s.vy *= 0.72;
          s.x = Math.max(-halfW + s.w / 2 + 10, Math.min(halfW - s.w / 2 - 10, s.x + s.vx));
          s.y = Math.max(-halfH + 58 + s.r, Math.min(halfH - 70 - s.r - 22, s.y + s.vy));
        }
        if (a > 0.004) alpha.current = a * 0.985;
        const now = typeof performance === "undefined" ? 0 : performance.now();
        const nextRenderNodes = new Map<string, RenderNode>();
        for (const { node, s } of list) {
          const frozen = reducedMotion.current || node.id === workId || s.fx != null || drag.current?.id === node.id;
          const amplitude = frozen ? 0 : 3.2 * (1 - Math.min(1, alpha.current * 3));
          nextRenderNodes.set(node.id, {
            x: s.x + (frozen ? 0 : Math.sin(now / 1700 + s.phase) * amplitude),
            y: s.y + (frozen ? 0 : Math.cos(now / 2100 + s.phase * 1.3) * amplitude),
            r: s.r,
          });
        }
        if (!reducedMotion.current || moving || hadMotion) setRenderNodes(nextRenderNodes);
      }
      // With reduced motion there is nothing to repaint once the layout settles.
      wasMoving = moving;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [facetAngles, firstRadius, nodes, ringX, ringY, size, workId]);

  const position = (id: string) => {
    const node = renderNodes.get(id);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  };

  const toGraph = (event: ReactPointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: point.x, y: point.y };
  };
  const onNodeDown = (event: ReactPointerEvent, id: string) => {
    if (id === workId) { setSelectedId(null); return; }
    (event.target as Element).setPointerCapture?.(event.pointerId);
    drag.current = { id, moved: false, x: event.clientX, y: event.clientY };
  };
  const onPointerMove = (event: ReactPointerEvent) => {
    const current = drag.current;
    if (!current) return;
    if (!current.moved && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 4) return;
    current.moved = true;
    const s = sim.current.get(current.id);
    if (!s) return;
    const point = toGraph(event);
    s.fx = point.x; s.fy = point.y;
    alpha.current = Math.max(alpha.current, 0.35);
  };
  const onPointerUp = () => {
    const current = drag.current;
    if (!current) return;
    const s = sim.current.get(current.id);
    if (s) { s.fx = undefined; s.fy = undefined; }
    // Released nodes spring back into their facet slot.
    alpha.current = Math.max(alpha.current, 0.5);
    if (!current.moved) toggleSelectedId(current.id);
    drag.current = null;
  };

  const activeId = hoveredId ?? selectedId;
  const activeSet = useMemo(() => {
    if (!activeId) return null;
    const set = new Set([activeId]);
    for (const link of links) if (link.source === activeId || link.target === activeId) { set.add(link.source); set.add(link.target); }
    return set;
  }, [activeId, links]);

  const selected = selectedId ? nodes.find((node) => node.id === selectedId) : undefined;
  const bookTitle = (key?: string) => stripEditionPrefix(books.find((book) => book.key === key)?.title);
  // Score sources name the book and printed page ("人音版八年级上册 第23页"); PDF pages do not.
  const scoreSource = work?.media?.find((asset) => asset.source)?.source?.replace(new RegExp(`^${EDITION.label}`), "").replace(/\s*第(\d+)页$/, " · 教材第 $1 页");
  const bookSources = (work?.bookKeys ?? []).map(bookTitle).filter(Boolean).join("、");
  const sourceLabel = (work?.bookKeys?.length ?? 0) > 1 ? bookSources : scoreSource ?? bookSources;
  const creators = nodes.filter((node) => node.depth === 1 && node.category === "person");
  const introFacts = attributes.filter((relation) => !LEARNING.test(relation.predicate) && !relation.extended);
  const learningFacts = attributes.filter((relation) => LEARNING.test(relation.predicate) && !relation.extended);
  const extendedFacts = [...attributes.filter((relation) => relation.extended), ...relationships.filter((relation) => relation.subject === workId && relation.extended && relation.objectId)];
  const valueOf = (relation: WorkGraphRelation) => relation.literal ?? entityMap.get(relation.objectId ?? "")?.name ?? "";
  const counts = FACETS.map((facet) => ({ ...facet, count: nodes.filter((node) => node.depth === 1 && node.facet === facet.key).length })).filter((facet) => facet.count);

  if (!work) return <section className="work-graph-empty"><p>没有找到这首作品。</p><button type="button" onClick={onBack}>返回</button></section>;

  return <section className="work-graph" aria-label={`${work.name}作品图谱`}>
    <div className="work-graph-stage" ref={stageRef}>
      <header className="work-graph-toolbar">
        <button type="button" className="work-graph-back" onClick={onBack}><WorkbenchIcon name="left" />返回学习页</button>
        <div className="work-graph-actions">
          <label><input type="checkbox" checked={showSecond} onChange={(event) => setShowSecond(event.target.checked)} />显示延伸作品</label>
          <button type="button" onClick={() => { for (const s of sim.current.values()) { s.x = (Math.random() - 0.5) * 30; s.y = (Math.random() - 0.5) * 30; } alpha.current = 1; }}><WorkbenchIcon name="reset" />重新排布</button>
        </div>
      </header>
      <svg ref={svgRef} className="work-graph-svg" viewBox={`${-size.width / 2} ${-size.height / 2} ${size.width} ${size.height}`} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onClick={(event) => { if (event.target === svgRef.current) setSelectedId(null); }}>
        <ellipse className="work-graph-orbit" rx={ringX} ry={ringY} />
        {links.map((link) => {
          const a = position(link.source), b = position(link.target);
          const active = activeSet ? activeSet.has(link.source) && activeSet.has(link.target) : false;
          const dim = Boolean(activeSet) && !active;
          const other = link.source === workId ? link.target : link.source;
          const node = nodes.find((item) => item.id === other);
          const color = SEMANTIC_PALETTE[node?.category ?? "work"].fill;
          // Labels sit nearer the outer end so the spokes around the work stay clear.
          const outer = link.source === workId ? b : a, inner = link.source === workId ? a : b;
          const mx = inner.x + (outer.x - inner.x) * 0.6, my = inner.y + (outer.y - inner.y) * 0.6;
          const showLabel = active || (!activeSet && link.depth === 1 && links.length <= 34 && firstRadius >= 180);
          return <g key={link.id} className={`work-graph-link depth-${link.depth} ${active ? "is-active" : ""} ${dim ? "is-dim" : ""}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={{ stroke: color }} />
            {showLabel && <text x={mx} y={my} className="work-graph-edge-label">{link.labels.slice(0, 2).join(" · ")}</text>}
          </g>;
        })}
        {nodes.map((node) => {
          const p = position(node.id);
          const s = renderNodes.get(node.id);
          const palette = SEMANTIC_PALETTE[node.category];
          const dim = Boolean(activeSet) && !activeSet!.has(node.id);
          const isSelected = node.id === selectedId;
          return <g key={node.id} className={`work-graph-node depth-${node.depth} ${dim ? "is-dim" : ""} ${isSelected ? "is-selected" : ""}`} transform={`translate(${p.x} ${p.y})`}
            onPointerDown={(event) => onNodeDown(event, node.id)} onPointerEnter={() => setHoveredId(node.id)} onPointerLeave={() => setHoveredId(null)}
            role="button" tabIndex={0} aria-label={`${node.entity.name}（${node.labels.join("、") || node.entity.type}）`}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(node.id); } }}>
            {node.depth === 0 ? <>
              <circle r={s?.r ?? 30} fill="var(--brand-ink)" stroke="#fff" strokeWidth={2} />
            </> : <>
              {isSelected && <circle r={(s?.r ?? 12) + 7} className="work-graph-halo" style={{ stroke: palette.fill }} />}
              <circle r={s?.r ?? 12} fill={node.depth === 2 ? palette.soft : palette.fill} stroke={node.depth === 2 ? palette.fill : "#fff"} strokeWidth={node.depth === 2 ? 1.6 : 2.5} />
            </>}
            <text className="work-graph-label" y={(s?.r ?? 12) + 17}>{labelText(node.entity.name, node.depth)}</text>
          </g>;
        })}
      </svg>
      <footer className="work-graph-footer">
        <div className="work-graph-legend">
          {counts.map((facet) => <span key={facet.key}><i style={{ background: SEMANTIC_PALETTE[facet.categories[0]].fill }} />{facet.label}<b>{facet.count}</b></span>)}
          {showSecond && nodes.some((node) => node.depth === 2) && <span className="is-second"><i />延伸作品<b>{nodes.filter((node) => node.depth === 2).length}</b></span>}
        </div>
        <p className="work-graph-hint">拖动知识点可拉开，松手弹回；点击知识点查看知识联系</p>
      </footer>
    </div>
    <aside className="work-graph-panel">
      <div className="work-graph-card">
        <h1 className="work-graph-sr">作品图谱</h1>
        <span className="work-graph-kicker">作品图谱</span>
        <span className="work-graph-type">{work.type}</span>
        <h2>{work.name}</h2>
        <p className="work-graph-source">{sourceLabel}</p>
        {creators.length > 0 && <p className="work-graph-creators">{creators.map((node) => <span key={node.id}><small>{node.labels.join("/")}</small>{node.entity.name}</span>)}</p>}
        <button type="button" className="work-graph-locate" onClick={() => onLocate(workId)}>在总图谱中定位<WorkbenchIcon name="arrow" /></button>
      </div>
      {selected && <div className="work-graph-card is-selection" aria-live="polite">
        <span className="work-graph-type" style={{ color: SEMANTIC_PALETTE[selected.category].stroke, background: SEMANTIC_PALETTE[selected.category].soft }}>{selected.entity.type}</span>
        <h3>{selected.entity.name}</h3>
        <p>{selected.depth === 1 ? `与本作品的知识联系：${selected.labels.join("、")}` : `经由「${entityMap.get(selected.parent ?? "")?.name ?? ""}」关联：${selected.labels.join("、")}`}</p>
        <div className="work-graph-selection-actions">
          {selected.category === "work" && <button type="button" onClick={() => onOpenWork(selected.id)}>打开它的作品图谱</button>}
          <button type="button" onClick={() => onLocate(selected.id)}>在总图谱中查看</button>
        </div>
      </div>}
      {(work.media?.length ?? 0) > 0 && <section className="work-graph-section">
        <h4>教材谱例</h4>
        <div className="work-graph-scores">{work.media!.map((asset) => {
          const size = SCORE_SIZES[asset.url];
          return <a key={asset.url} href={assetUrl(asset.url)} target="_blank" rel="noreferrer" title="打开原尺寸谱例">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" src={assetUrl(asset.url)} alt={asset.title ?? "教材谱例"} width={size?.[0]} height={size?.[1]} />
          </a>;
        })}</div>
      </section>}
      {introFacts.length > 0 && <FactList title="作品要点" facts={introFacts} valueOf={valueOf} />}
      {learningFacts.length > 0 && <FactList title="学习与实践" facts={learningFacts} valueOf={valueOf} />}
      {extendedFacts.length > 0 && <FactList title="拓展知识" facts={extendedFacts} valueOf={valueOf} extended />}
    </aside>
  </section>;
}

function FactList({ title, facts, valueOf, extended }: { title: string; facts: WorkGraphRelation[]; valueOf: (relation: WorkGraphRelation) => string; extended?: boolean }) {
  return <section className={`work-graph-section ${extended ? "is-extended" : ""}`}>
    <h4>{title}{extended && <small>教材之外 · 已审阅</small>}</h4>
    <dl>{facts.map((relation) => <div key={relation.id}>
      <dt>{relation.label ?? relation.predicate}</dt>
      <dd>{valueOf(relation)}{!extended && layerOf(relation) && <em>{layerOf(relation)}</em>}</dd>
    </div>)}</dl>
  </section>;
}
