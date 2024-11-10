export * from "./atoms";
export * from "./selectors";
export * from "./transactions";
export * from "./types";

export const ADMIN_ALLOWLIST = ["7btJUBpZq3pzhYJBF9pkCBJ4xa4de1ZnUeJ4WiA5TiHT"];
export const MM_ALLOWLIST = [
  "9xq6X56Wus7xpCjEQiQQFiwYcB1ZJNS9j9Z2An5wtmF9",
  "3w6py7p6ZP8gboq5AZtLygpRxVcDm7pcfKywbF5ybiEP",
  "2xFbZtJjR3szsVXrjVwU35uA9uk35xujNufdUzPFsqFL",
];
export const DEAD_VAULT_LIST = [
  // mainnet
  "EcyuJx6Pkgfn8iLpTbePTiPRDcxnwV49vhRVmhrL3AUY", // SOL-USDT
  "6JwmYu4cveodYbXYtJ3zxTTuSR9mXZb6iENNMnXdUwBK", // PYTH-USDC (sellor strategy)
  "5N3KrNt4jEq2iETfTcGh66PoS7tdDpvSvutoDiabcQL9" // BONK-USDC (sellor strategy)
  // devnet
];

export const DEPRECATED_VAULT_LIST = [
  // mainnet
  "9QSvxJjTpoWQXfjnEB3uWsNgG8nDMMwxwhTtSLyrb7Xs", // legacy tBTC-USDC
  "AAqJh2pAARhxkC8HYhy6QgmGNfFPhR57CKo2za1eSGDf", // legacy SOL-USDC
  "9AFtBurZVRdoPYiR41Yiq9xLfHoc2a25PoZUFEeCee48", // legacy jitoOLl-USDC
  "ARSSATavyjXFvoVYv15hfzUjZGWFmdfjPvYxKXyocMQf", // legacy HXRO-USDC
  // devnet
];
