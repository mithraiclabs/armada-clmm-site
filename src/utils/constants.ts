import { Keypair, PublicKey } from "@solana/web3.js";

export const DEVELOPMENT_MODE = false; //import.meta.env.DEV;

export const DEVNET_BROADCAST_URLS: string[] = import.meta.env
  .VITE_DEVNET_RPC_BROADCAST_URLS
  ? import.meta.env.VITE_DEVNET_RPC_BROADCAST_URLS.split(",")
  : [];

export const MAINNET_BROADCAST_URLS: string[] = import.meta.env
  .VITE_MAINNET_RPC_BROADCAST_URLS
  ? import.meta.env.VITE_MAINNET_RPC_BROADCAST_URLS.split(",")
  : [];

/**
 * If true, wallet defaults to devnet, else mainnet
 */
export const DEFAULT_IS_DEVNET = true;
/**
 * If true, defaults to using native decimals for display, else uses floats (e.g. 1.25 SOL)
 */
export const DEFAULT_USE_NATIVE = false;

export const TX_TIMEOUT_DEFAULT = 30000;
export const MAX_TX_RETRIES_DEFAULT = 10;

/** Base URL for historical data API */
export const API_BASE_URL = "https://clpvaulthistory-miqb2uc7eq-uc.a.run.app";

/**
 * All currency is displayed using the local currency formatter (currently US only)
 */
export const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * Curve params like c, d, k0, k1 use this many decimals. Divide by 10^this value to get back to float
 */
export const CURVE_PARAM_PRECISION = 12;
/**
 * The Token Swapper uses this many decimals for exchange rate, divide by 10^this to get back to float
 */
export const EXCHANGE_RATE_DECIMALS = 4;
/** 10^EXCHANGE_RATE_DECIMALS, represents 100%, e.g. a 1:1 token exchange */
export const EXCHANGE_RATE_ONE = 10_000;

export const ONE_WEEK_IN_SECONDS = 604800;

export const PSYSTAKE_DEVNET_PROGRAM_KEY =
  "EpgGpJrSjF3g7Hjr4a2seq2Xw1SNNukNEoUS1FFddDDj";
// TODO UPDATE WHEN DEPLOYED
export const PSYSTAKE_MAINNET_PROGRAM_KEY =
  "pSystkitWgLkzprdAvraP8DSBiXwee715wiSXGJe8yr";

export const LBC_DEVNET_PROGRAM_KEY =
  "7Z3SnfMBbcZosYqViuP793BpebBYScQzDkejRiFnR6bp";
export const LBC_MAINNET_PROGRAM_KEY =
  "LBCZU6Nogrx2oAAt3uiuzB4zzuYzLovMXPJ5RcZfJ8U";

export const SWAPPER_DEVNET_PROGRAM_KEY =
  "DEZ2mmDfvG2q5xuQW5t91LwMRF43VdbXeCqJv88mtTGY";
export const SWAPPER_MAINNET_PROGRAM_KEY =
  "exch6P2DC2UrU91PfbU72Ch6q1gRy5bDyyTJMqAQhKM";

export const CLP_DEVNET_PROGRAM_KEY =
  "ArmN3Av2boBg8pkkeCK9UuCN9zSUVc2UQg1qR2sKwm8d";
export const CLP_MAINNET_PROGRAM_KEY =
  "ArmN3Av2boBg8pkkeCK9UuCN9zSUVc2UQg1qR2sKwm8d";

export const PYTH_ORACLE_PID = new PublicKey(
  "FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH"
);
export const PYTH_ORACLE_DEVNET_PID = new PublicKey(
  "gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s"
);

export const SWITCHBOARD_V2_ORACLE_PID = new PublicKey(
  "SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f"
);
/** Decimals for the vault tokens and initial ratio */
export const CLP_VAULT_TOKEN_DECIMALS = 6;

export const QUICKNODE_MAINNET_RPC =
  "https://winter-young-wind.solana-mainnet.quiknode.pro/c87727ea4d36a5fd43566e06dd703f23121db6f4/";
export const SYNDICA_MAINNET_RPC =
  "https://solana-api.syndica.io/access-token/8bkoJHRYyFJQQdvtWK47qHlGXzTEkZYyWXKaQs57jhDqZyuiJdl0B3cnh7f6XB9V/";
export const SERUM_MAINNET_RPC = "https://solana-api.projectserum.com";
export const GG_DEVNET_RPC = "https://devnet.genesysgo.net/";
export const SOLANA_DEVNET_RPC = "https://api.devnet.solana.com";

export const EMULATOR_API_URL =
  "http://127.0.0.1:5001/psyfi-api-dev/us-central1/";
export const PROD_API_URL = "https://us-central1-psyfi-api.cloudfunctions.net/";

/**
 * Maps a mint to the decimals it uses for native currency.
 */
export const MINT_TO_DECIMALS = new Map<string, number>([
  // SOL is the same on devnet and mainnet.
  ["So11111111111111111111111111111111111111112", 9],

  // devnet mints
  ["E6Z6zLzk8MWY3TY8E87mr88FhGowEPJTeMWzkqtL6qkF", 2], // usdc old
  ["9dbktdo4aG25kDRz2p7nXPhoxLrsK6zEs4X8rrEM5VB8", 6], // usdc new
  ["C6kYXcaRUMqeBF5fhg165RWU7AnpT9z92fvKNoMqjmz6", 9], // btc
  ["DgwSrEocnibPBjyYpHWbnaTcDfd4nQPDn4J2xdwcwidz", 6], // usdc x1000 voucher
  ["CvZ4vz4dG5BdbWkbtwppwr44gpPwb7mq61sPyVUNp9h1", 6], // Pep voucher
  ["VSK62NdGcyv92o5ohsNmWiYFmKHGjmpbTA7VPL5oevK", 6], // Pep

  // Mainnet mints
  ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 6], // usdc
]);

// Put in the vaults with points here
export const PointsEligibleVaults = {
  "-7c75jrcMMJVEPtr1hwdBQTMJCKpjquGQk9b3p237vYyc": {
    description:
      "This vault participates in the INF points program. Depositing into this vault will continually add towards points to your standing.",
    infoLink: "https://google.com",
    tokenSymbol: "INF",
  },
} as {
  [vaultid: string]: PointsInfo | null;
};

export type PointsInfo = {
  description: string;
  infoLink: string;
  tokenSymbol: string;
};

export const USDC_MINT_DEVNET_KEYPAIR = Keypair.fromSecretKey(
  new Uint8Array([
    2, 15, 5, 216, 188, 23, 131, 59, 219, 25, 238, 43, 180, 101, 197, 197, 208,
    168, 151, 204, 34, 140, 122, 34, 143, 149, 202, 213, 245, 86, 191, 235, 128,
    61, 180, 63, 156, 104, 147, 39, 26, 222, 159, 12, 3, 252, 41, 234, 207, 154,
    171, 149, 251, 98, 246, 160, 124, 217, 157, 179, 249, 0, 172, 251,
  ])
);
export const USDC_MINT_DEVNET = "9dbktdo4aG25kDRz2p7nXPhoxLrsK6zEs4X8rrEM5VB8";
export const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDC_X1000_VOUCHER_MINT_DEVNET =
  "4hyd6AZdSdGi9nXmi1CufRvLi68hXmNwFnXoCBTeTjqS";
// TODO UPDATE WHEN DEPLOYED
export const USDC_X1000_VOUCHER_MINT_MAINNET =
  "4hyd6AZdSdGi9nXmi1CufRvLi68hXmNwFnXoCBTeTjqS";
export const USDC_X1_VOUCHER_MINT_DEVNET =
  "5kA6sHcTGWkkWVsz8CuzQgnw1yS2gRVxBqGtpVKap3Mt";
export const USDC_X15_VOUCHER_MINT_DEVNET =
  "6cNtut2KFgHhuq3xjQV697VbtVhqxu25JtARijDGXt1A";
// TODO UPDATE WHEN DEPLOYED
export const USDC_X1_VOUCHER_MINT_MAINNET =
  "5kA6sHcTGWkkWVsz8CuzQgnw1yS2gRVxBqGtpVKap3Mt";
export const USDC_TO_VOUCHER_EXCHANGE_DEVNET =
  "FRhFeaegW6Y39ekH7FbNZzfGZ3VB1N1urNhbaSDCnN7B";
// TODO UPDATE WHEN DEPLOYED
export const USDC_TO_VOUCHER_EXCHANGE_MAINNET =
  "FRhFeaegW6Y39ekH7FbNZzfGZ3VB1N1urNhbaSDCnN7B";

export const PEP_VOUCHER_MINT_DEVNET =
  "AYmrPkXXSecjigTHKitUEerrKqFo19nEjtwKstijRwq4";
// TODO UPDATE WHEN DEPLOYED
export const PEP_VOUCHER_MINT_MAINNET =
  "AYmrPkXXSecjigTHKitUEerrKqFo19nEjtwKstijRwq4";

// Each time we deploy a test bonding without closing the old one, the voucher mint is burned
// because the bonding takes ownership of it.
export const PEP_VOUCHER_MINT_DEVNET_ALPHA =
  "35trKGdv1QUj1UVGgFN99oJ5dJm6mUn3gmuscazyy2yF";
export const PEP_VOUCHER_MINT_DEVNET_BETA =
  "8Sa78fMpJBf5zNfzP9ZFzaicoLBo5TRJgH53Pq76yo9F";
export const CYPH_VOUCHER_MINT_DEVNET_ALPHA =
  "BWd3RbVircC95HzKTFpFtxktDqiupaAwgyffmyAWCmFr";
export const PEP_MINT_DEVNET = "VSK62NdGcyv92o5ohsNmWiYFmKHGjmpbTA7VPL5oevK";
export const CYPH_MINT_DEVNET = "Bi1PJXTAazELXi5ofsAmMqHsEtMFQKS3tyWeR2GMXoqy";
// TODO UPDATE WHEN DEPLOYED
export const PEP_MINT_MAINNET = "VSK62NdGcyv92o5ohsNmWiYFmKHGjmpbTA7VPL5oevK";

// KNOWN DEVNET ADDRESSES FOR TESTING

// CYPHER ALPHA (Starts Sept 21, 2023)
/*
Token-Swapper enabled LBC STYLE curve
Behind the scenes summary: 
  USDC -> Exchange USDC Voucher X15 -> Buy from Bonding -> Get PEP Alt Voucher -> Exchange PEP

***********USDC TO USDC X15 VOUCHER EXCHANGE***************** (recycled from previous)
Base: USDC_MINT_DEVNET
Target: USDC_X15_VOUCHER_MINT_DEVNET
Exchange: D5ZGzWsS3874QgeqvS5ZTRULiBNRDyWUoxgSZxXL3kwF (USDC/USDC X15 voucher)
  rate: 15, seed: 0, store base: YES, seized mint: YES
  1 USDC = 15 voucher
  Admin + Withdraw base/target authority: HbAUuJUL9qf94snWJ72BYHSME71gGKaAZ5668kNfPsps
Target mint is seized, exchange funding infinite

***********CYPH VOUCHER TO CYPH EXCHANGE*****************
Base: CYPH_VOUCHER_MINT_DEVNET_ALPHA
Target: CYPH_MINT_DEVNET
Exchange: HNyUFDGB32nBmb9duigd6MWDfjHYgv5sm5GVnBubg47 (Cyph voucher/Cyph)
  rate: 1, seed: 0, store base: NO, seized mint: NO
  1 Cyph voucher = 1 Cyph
  Admin + Withdraw base/target authority: HbAUuJUL9qf94snWJ72BYHSME71gGKaAZ5668kNfPsps
Exchange pool funded with 400,000,000 Cyph (400,000,000,000,000 in native decimals))

***************BONDING*************************
Bonding sells CYPH VOUCHER in exchange for USDC X15 VOUCHER
sale ends 7 days after 9/21/23 @ 3:45pm EST (~604800 seconds later)
Base Mint: USDC_X15_VOUCHER_MINT_DEVNET
Token Mint: CYPH_VOUCHER_MINT_DEVNET_ALPHA
Curve: CYwfUQVcttLuByC2jmHf2HYUahFtLH7TCSjqwpY8BJAB
  Weight start/end: .07/.15
  See bonding for initial liquidity settings
Bonding: CsxwpueX6dLyhtuHAbCLG9uqF4mXM4YNnqgvS7uum9Vk
 mint cap = 400,000,000
 purchase cap = 5,000,000
 Initial Virtual Target Liquidity: 400,000,000
 Initial Virtual Base Liquidity: 5,000,000
audit log: 6BSgKCjQ7Dr3LpRHXPtBYeALoWVWmU8x2gY9sdsXTUVL

One initial purchase made for 10,000 at ~ $111

*/

// CURRENT SALE (Starts Aug 11, 2023)
/*
Token-Swapper enabled LBC STYLE curve
Behind the scenes summary: 
  USDC -> Exchange USDC Voucher X1 -> Buy from Bonding -> Get PEP Alt Voucher -> Exchange PEP

***********USDC TO USDC X1 VOUCHER EXCHANGE***************** (recycled from previous)
Base: USDC_MINT_DEVNET
Target: USDC_X1_VOUCHER_MINT_DEVNET
Exchange: FQrramLKTLvmc7AHanf7N8M2nWszeavbjjWauYcw5LHK (USDC/USDC X1 voucher)
  rate: 1, seed: 0, store base: YES, seized mint: YES
  1 USDC = 1 voucher
  Admin + Withdraw base/target authority: HbAUuJUL9qf94snWJ72BYHSME71gGKaAZ5668kNfPsps
Target mint is seized, exchange funding infinite

***********PEP VOUCHER TO PEP EXCHANGE*****************
Base: PEP_VOUCHER_MINT_DEVNET_BETA
Target: PEP_MINT_DEVNET
Exchange: FUAFTT3fjrkYfhhCU95UmATBdAAdjhedqauABEQujXPo (PEP voucher/PEP)
  rate: 1, seed: 0, store base: NO, seized mint: NO
  1 PEP voucher = 1 PEP
  Admin + Withdraw base/target authority: HbAUuJUL9qf94snWJ72BYHSME71gGKaAZ5668kNfPsps
Exchange pool funded with 20,000,000 PEP (20,000,000,000,000 in native decimals))

***************BONDING*************************
Bonding sells PEP VOUCHER in exchange for USDC X1 VOUCHER
sale ends 7 days after 8/11/23 @ 2:00am EST (~604800 seconds later)
Base Mint: USDC_X1_VOUCHER_MINT_DEVNET
Token Mint: PEP_VOUCHER_MINT_DEVNET_BETA
Curve: Cfqq4iyT9or88Fhotuj4Go9HW5kuBN1Y8xwfsBFs9Ypg
  Weight start/end: .08/.28
  See bonding for initial liquidity settings
Bonding: DakeNZwZipskwTjyjgxP94yhwpMmR3uuSj7WbmDSQLru
 mint cap = 20,000,000
 purchase cap = 500,000
 Initial Virtual Target Liquidity: 15,000,000
 Initial Virtual Base Liquidity: 500,000
audit log: DDCaRKbfvBUM2bU7imiGq7VWGYcWsCekiD8jnD2QUhc3

*/

// EXPIRED PREVIOUS SALE
/*
Token-Swapper enabled LBC STYLE curve
Behind the scenes summary: 
  USDC -> Exchange USDC Voucher X1 -> Buy from Bonding -> Get PEP Alt Voucher -> Exchange PEP

***********USDC TO USDC X1 VOUCHER EXCHANGE*****************
Base: USDC_MINT_DEVNET
Target: USDC_X1_VOUCHER_MINT_DEVNET
Exchange: FQrramLKTLvmc7AHanf7N8M2nWszeavbjjWauYcw5LHK (USDC/USDC X1 voucher)
  rate: 1, seed: 0, store base: YES, seized mint: YES
  1 USDC = 1 voucher
  Admin + Withdraw base/target authority: HbAUuJUL9qf94snWJ72BYHSME71gGKaAZ5668kNfPsps
Target mint is seized, exchange funding infinite

***********PEP VOUCHER TO PEP EXCHANGE*****************
Base: PEP_VOUCHER_MINT_DEVNET_ALPHA
Target: PEP_MINT_DEVNET
Exchange: 271qk2APa6NiykaSEDDCsemgPK4dWNvpCFUUm83XWLo8 (PEP voucher/PEP)
  rate: 1, seed: 0, store base: NO, seized mint: NO
  1 PEP voucher = 1 PEP
  Admin + Withdraw base/target authority: HbAUuJUL9qf94snWJ72BYHSME71gGKaAZ5668kNfPsps
Exchange pool funded with 20,000,000 PEP (20,000,000,000,000 in native decimals))

***************BONDING*************************
Bonding sells PEP VOUCHER in exchange for USDC X1 VOUCHER
sale ends 7 days after 8/1/23 @ 4:00pm EST (~604800 seconds later)
Base Mint: USDC_X1_VOUCHER_MINT_DEVNET
Token Mint: PEP_VOUCHER_MINT_DEVNET_ALPHA
Curve: Cfqq4iyT9or88Fhotuj4Go9HW5kuBN1Y8xwfsBFs9Ypg
  Weight start/end: .08/.28
  See bonding for initial liquidity settings
Bonding: 3iL54aNhjq2uqf4WX59nyT58f2hyHDfrj5pCEbhPYTTU
 mint cap = 20,000,000
 purchase cap = 500,000
 Initial Virtual Target Liquidity: 15,000,000
 Initial Virtual Base Liquidity: 500,000
audit log: ChfywALSkazuqzKbpVyMq6F8D92fqaECE9w1auUyPAYw

*/
