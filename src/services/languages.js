const MARC_TO_ISO = {
  alb: "sqi",
  arm: "hye",
  baq: "eus",
  bur: "mya",
  chi: "zho",
  cze: "ces",
  dut: "nld",
  fre: "fra",
  geo: "kat",
  ger: "deu",
  gre: "ell",
  ice: "isl",
  mac: "mkd",
  may: "msa",
  per: "fas",
  rum: "ron",
  slo: "slk",
  tib: "bod",
  wel: "cym",
};

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

export function formatLanguage(code) {
  if (!code) {
    return null;
  }

  try {
    return languageNames.of(MARC_TO_ISO[code] || code);
  } catch {
    return code;
  }
}
