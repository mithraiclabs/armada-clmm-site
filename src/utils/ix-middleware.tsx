import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
  BuyArgs,
  CurveType,
  ICurveConfig,
  IDL as SplTokenBondingIDL,
  TokenBondingV0,
  TokenBondingV0Args,
  createBaseStorage,
  generateBaseBuyArgs,
  generateTargetBuyArgs,
  deriveTokenBonding,
  buyV1Simple,
  createAndInitAuditLog,
  createCurveV0,
  initCurveAccount,
  initTokenBondingV0,
  registerSwapper,
  transferReservesV0Simple,
  yieldMintToAuthority,
} from "@mithraic-labs/spl-token-bonding";
import { BN, Program } from "@coral-xyz/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { AccountLayout } from "@solana/spl-token";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { EXCHANGE_RATE_ONE } from "./constants";
import {
  TokenExchange,
  TokenSwapperIDL,
  exchangeIx,
  withdrawBase,
  withdrawTarget,
} from "@mithraic-labs/token-swapper";
import { BuyType } from "./types";

// Deprecated
// export enum InitSolStorageStatus {
//   OK,
//   ALREADY_EXISTS,
// }

// Deprecated
// /**
//  * Checks if the ProgramStateV0 already exists, and returns the tx and mint keypair (which must
//  * sign) to create one if it does not.
//  *
//  * Only one ProgramStateV0 is required per program!
//  * @param program
//  * @param connection
//  * @param wallet
//  * @returns a tx and mint keypair to create the sol storage, if one does not exist. If one does not
//  * exist, returns undefined for both, and status code ALREADY_EXISTS
//  */
// export const initSolStorageTxAsNeeded = async (
//   program: Program<typeof SplTokenBondingIDL>,
//   connection: Connection,
//   wallet: AnchorWallet
// ) => {
//   const [programState, _stateBump] = deriveProgramState(program.programId);
//   const acc = await connection.getAccountInfo(programState);
//   if (acc) {
//     const status = InitSolStorageStatus.ALREADY_EXISTS;
//     return { tx: undefined, wsolMint: undefined, status };
//   }

//   const [wsolAuthority, _wsolAuthBump] = deriveWsolAuth(program!.programId);
//   let tx: Transaction = new Transaction();
//   const { ixes, mint: wsolMint } = await createNativeMintAndYieldAuthority(
//     wallet.publicKey,
//     wsolAuthority,
//     program.provider
//   );
//   tx.add(...ixes);
//   tx.add(await initSolStorageV0(program, wallet.publicKey, wsolMint.publicKey));
//   const status = InitSolStorageStatus.OK;
//   return { tx, wsolMint, status };
// };

/**
 * Returns instructions to create a curve account and initialize it for use
 * @param program
 * @param wallet - will pay rent for the curve acc
 * @param curveType - exponential or lbp style
 * @param curvePieces - Unless this curve uses multiple configs, this is 1
 * @param curveConfig
 * @returns ixes to send and keypair of the curve, which must sign
 */
export const initAndCreateCurveAccount = async (
  program: Program<typeof SplTokenBondingIDL>,
  wallet: AnchorWallet,
  curveType: CurveType,
  curvePieces: number,
  curveConfig: ICurveConfig
) => {
  const ixes: TransactionInstruction[] = [];
  const { ix: initCurveIx, curveKeypair } = await initCurveAccount(
    program,
    wallet.publicKey,
    curveType,
    curvePieces
  );
  ixes.push(initCurveIx);

  const createCurveIx = await createCurveV0(
    program,
    curveConfig,
    wallet.publicKey,
    curveKeypair.publicKey
  );
  ixes.push(createCurveIx);

  return { ixes, curveKeypair };
};

/**
 * Ixes to create a base storage, create a token bonding, and yield mint authority to the bonding.
 *
 * Must be signed by the base storage keypair and the mint authority.
 * @param program
 * @param args
 * @param tokenMint - typically the mint created for this sale
 * @param baseMint - typically USDC
 * @param wallet - must own the token mint
 * @param curveKey - should already be created/init
 * @param connection - use to fetch rent exemption
 * @param baseSwapper - (optional) register the swapper for (X -> bonding.base)
 * @param targetSwapper - (optional) register the swapper for (bonding.target -> Y)
 * @returns
 */
export const initAndCreateTokenBonding = async (
  program: Program<typeof SplTokenBondingIDL>,
  args: TokenBondingV0Args,
  tokenMint: PublicKey,
  baseMint: PublicKey,
  wallet: AnchorWallet,
  curveKey: PublicKey,
  connection: Connection,
  baseSwapper?: PublicKey,
  targetSwapper?: PublicKey
) => {
  const initIxes: TransactionInstruction[] = [];

  const [tokenBondingKey, _bump] = deriveTokenBonding(
    program.programId,
    tokenMint,
    args.index
  );

  // Create the storage account for base tokens
  const { baseStorageKeypair, ixes } = createBaseStorage(
    wallet.publicKey,
    tokenBondingKey,
    await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
    baseMint
  );
  const baseStorageKey = baseStorageKeypair.publicKey;
  initIxes.push(...ixes);
  // Yield the target token mint to the token bonding
  initIxes.push(
    ...yieldMintToAuthority(tokenMint, wallet.publicKey, tokenBondingKey, true)
  );
  // Create the token bonding
  initIxes.push(
    await initTokenBondingV0(
      program,
      args,
      wallet.publicKey,
      curveKey,
      baseMint,
      tokenMint,
      baseStorageKey
    )
  );
  const { ixes: auditLogIxes, auditLogKeypair } = await createAndInitAuditLog(
    program,
    wallet.publicKey,
    tokenBondingKey
  );
  // Init the audit log after the token bonding is created.
  initIxes.push(...auditLogIxes);
  if (baseSwapper || targetSwapper) {
    const registerSwapperIx = await registerSwapper(
      program,
      wallet.publicKey,
      tokenBondingKey,
      baseSwapper || PublicKey.default,
      targetSwapper || PublicKey.default
    );
    initIxes.push(registerSwapperIx);
  }
  return { initIxes, tokenBondingKey, baseStorageKeypair, auditLogKeypair };
};

/**
 * Ixes to create ATAs and execute a token exchange using the Token Swapper program, before or after
 * a buy takes place from the bonding curve.
 * @param swapperProgram
 * @param connection
 * @param tokenExchangeKey
 * @param tokenExchange
 * @param wallet
 * @param amount
 * @param skipBaseAta - If true, don't create a base ata. Useful when you know another ix in the
 * same tx is already making it. Default false.
 */
export const exchangeTokens = async (
  swapperProgram: Program<typeof TokenSwapperIDL>,
  connection: Connection,
  tokenExchangeKey: PublicKey,
  tokenExchange: TokenExchange,
  wallet: AnchorWallet,
  amount: number,
  skipBaseAta: boolean
) => {
  const ixes: TransactionInstruction[] = [];
  const baseAtaKey = getAssociatedTokenAddressSync(
    tokenExchange.baseMint,
    wallet.publicKey
  );
  const targetAtaKey = getAssociatedTokenAddressSync(
    tokenExchange.targetMint,
    wallet.publicKey
  );
  const baseAtaPromise = connection.getAccountInfo(baseAtaKey);
  const targetAtaPromise = connection.getAccountInfo(targetAtaKey);
  const baseAta = await baseAtaPromise;
  const targetAta = await targetAtaPromise;

  if (!baseAta && !skipBaseAta) {
    ixes.push(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        baseAtaKey,
        wallet.publicKey,
        tokenExchange.baseMint
      )
    );
  }
  if (!targetAta) {
    ixes.push(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        targetAtaKey,
        wallet.publicKey,
        tokenExchange.targetMint
      )
    );
  }

  // console.log(
  //   "queued swap of " +
  //     amount +
  //     " of " +
  //     tokenExchange.baseMint +
  //     " to " +
  //     tokenExchange.targetMint
  // );
  ixes.push(
    await exchangeIx(
      swapperProgram,
      wallet!.publicKey,
      tokenExchangeKey,
      tokenExchange.targetMint,
      tokenExchange.baseMint,
      targetAtaKey,
      baseAtaKey,
      PublicKey.default,
      new BN(amount),
      tokenExchange.isTargetMintSeized
    )
  );
  return ixes;
};

/**
 * Ixes to create an ATA for the target token as-needed and execute a buy order.
 *
 * Expects user to have a valid ATA on the base account with funds.
 * @param lbcProgram
 * @param swapperProgram
 * @param amount - amount to buy (target or base, depending on buy type), as float (no decimals). If
 * an exchange is in use, this is the amount of exchange base X, e.g. X -> X voucher -> bonding
 * @param estimate - the predicted amount received (target or base, depending on buy type), as float
 * (no decimals). Typically already has slippage applied. If an exchange is in use, this is the
 * amount of exchange base Y voucher. e.g. bonding -> Y voucher -> Y
 * @param tokenBondingKey
 * @param tokenBonding - a loaded bonding, does not have to be up-to-date (however, the estimate must)
 * @param wallet - signing wallet for all ixes
 * @param connection - used to load atas
 * @param buyType - target or base, determines the currency used for amount/estimate
 * @param baseDecimals - of the bonding, typically read from the bonding
 * @param targetDecimals - of the bonding, typically read from the bonding
 * @returns
 */
export const buyV1Complete = async (
  lbcProgram: Program<typeof SplTokenBondingIDL>,
  swapperProgram: Program<typeof TokenSwapperIDL>,
  amount: number,
  estimate: number,
  tokenBondingKey: PublicKey,
  tokenBonding: TokenBondingV0,
  wallet: AnchorWallet,
  connection: Connection,
  buyType: BuyType,
  baseDecimals: number,
  targetDecimals: number
) => {
  const ixes: TransactionInstruction[] = [];

  // If an exchange exists on either end, load it
  const swapperBaseKey = tokenBonding.swapperBase;
  const swapperTargetKey = tokenBonding.swapperTarget;
  let ebPromise, etPromise;
  let swapperBase: TokenExchange | undefined;
  let swapperTarget: TokenExchange | undefined;

  // Load exchanges in parallel, as-needed (yes, this is shorter than Promise.all)
  if (!swapperBaseKey.equals(PublicKey.default)) {
    ebPromise = swapperProgram.account.tokenExchange.fetch(swapperBaseKey);
  }
  if (!swapperTargetKey.equals(PublicKey.default)) {
    etPromise = swapperProgram.account.tokenExchange.fetch(swapperTargetKey);
  }
  if (!swapperBaseKey.equals(PublicKey.default) && ebPromise) {
    swapperBase = await ebPromise;
  }
  if (!swapperTargetKey.equals(PublicKey.default) && etPromise) {
    swapperTarget = await etPromise;
  }

  let toPayBase: number;
  let toGetTarget: number;
  const exchangeModifier: number = swapperBase
    ? swapperBase.exchangeRate / EXCHANGE_RATE_ONE
    : 1;
  let buyArgs: BuyArgs;
  if (buyType == BuyType.Base) {
    toPayBase = amount * 10 ** baseDecimals;
    toGetTarget = estimate * 10 ** targetDecimals;
    buyArgs = generateBaseBuyArgs(
      new BN(toPayBase * exchangeModifier),
      new BN(toGetTarget)
    );
  } else {
    toPayBase = estimate * 10 ** baseDecimals;
    toGetTarget = amount * 10 ** targetDecimals;
    // console.log(
    //   "Trying to pay: " +
    //     toPayBase +
    //     " USDC which is " +
    //     toPayBase * exchangeModifier +
    //     " Vouchers for " +
    //     toGetTarget
    // );
    buyArgs = generateTargetBuyArgs(
      new BN(toGetTarget),
      new BN(toPayBase * exchangeModifier)
    );
  }

  // A base exchange exists, initiate the swap before bonding purchase
  // TODO Because the swap uses the estimated payment amount including slippage for a TARGET buy,
  // it incidently also over-exchanges buy tokens, and the exchange essentially keeps the slippage
  // as a difference. This only applies to TARGET buys, since BASE buys specify an exact amount. The
  // user also ends up with the leftover vouchers, which technically they could spend to buy more
  // from the LBC.
  if (swapperBase) {
    const exchangeBeforeIxes = await exchangeTokens(
      swapperProgram,
      connection,
      swapperBaseKey,
      swapperBase,
      wallet,
      toPayBase,
      false
    );
    ixes.push(...exchangeBeforeIxes);
  }

  const tokenMint = tokenBonding.targetMint;
  const baseMint = tokenBonding.baseMint;
  const bondingTargetAtaKey: PublicKey = getAssociatedTokenAddressSync(
    tokenMint,
    wallet.publicKey
  );
  const bondingBaseAtaKey = getAssociatedTokenAddressSync(
    baseMint,
    wallet.publicKey
  );
  const targetAtaPromise = connection.getAccountInfo(bondingTargetAtaKey);
  const bondingBaseAtaPromise = connection.getAccountInfo(bondingBaseAtaKey);

  const bondingTargetAta = await targetAtaPromise;
  const bondingBaseAta = await bondingBaseAtaPromise;
  if (!bondingTargetAta) {
    // console.log("creating an ATA for vouchers");
    ixes.push(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        bondingTargetAtaKey,
        wallet.publicKey,
        tokenMint
      )
    );
  }
  if (!bondingBaseAta && !swapperBase) {
    console.error(
      "Payment account doesn't exist, you may need create and fund the base acc"
    );
  }

  ixes.push(
    await buyV1Simple(
      lbcProgram,
      buyArgs,
      tokenBondingKey,
      tokenBonding,
      bondingTargetAtaKey,
      bondingBaseAtaKey,
      wallet.publicKey,
      tokenBonding.auditLog
    )
  );

  // A target exchange exists, initiate the swap after bonding purchase
  // Note: In a BASE sale, set the amount to exchange to u64 max, which exchanges all vouchers
  if (swapperTarget) {
    swapperTarget.isTargetMintSeized;
    const exchangeAfterIxes = await exchangeTokens(
      swapperProgram,
      connection,
      swapperTargetKey,
      swapperTarget,
      wallet,
      toGetTarget,
      true
    );
    ixes.push(...exchangeAfterIxes);
  }

  return ixes;
};

/**
 * Ixes to create USDC ata as needed and withdraw USDC proceeds from the bonding.
 * @param program
 * @param amount
 * @param tokenBondingKey
 * @param wallet
 * @param connection
 * @param isDevnet
 */
export const transferReservesV0Complete = async (
  program: Program<typeof SplTokenBondingIDL>,
  amount: BN,
  tokenBondingKey: PublicKey,
  wallet: AnchorWallet,
  connection: Connection
) => {
  const ixes: TransactionInstruction[] = [];
  const bondingPromise = program.account.tokenBondingV0.fetch(tokenBondingKey);
  const tokenBondingAcc: TokenBondingV0 = await bondingPromise;
  const baseAtaKey = getAssociatedTokenAddressSync(
    tokenBondingAcc.baseMint,
    wallet.publicKey
  );
  const baseAtaPromise = connection.getAccountInfo(baseAtaKey);
  const baseAta = await baseAtaPromise;

  if (!baseAta) {
    ixes.push(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        baseAtaKey,
        wallet.publicKey,
        tokenBondingAcc.baseMint
      )
    );
  }
  ixes.push(
    await transferReservesV0Simple(
      program,
      amount,
      tokenBondingKey,
      tokenBondingAcc,
      baseAtaKey
    )
  );

  return ixes;
};

/**
 * Common function to withdraw base or target assets from a token swapper/exchange, including
 * creating the ata as needed
 * @param program
 * @param amount
 * @param exchangeKey
 * @param mint
 * @param wallet
 * @param connection
 * @param isBase
 * @returns
 */
export const withdrawFromSwapper = async (
  program: Program<typeof TokenSwapperIDL>,
  amount: BN,
  exchangeKey: PublicKey,
  mint: PublicKey,
  wallet: AnchorWallet,
  connection: Connection,
  isBase: boolean
) => {
  const ixes: TransactionInstruction[] = [];
  const ataKey = getAssociatedTokenAddressSync(mint, wallet.publicKey);
  const ataPromise = connection.getAccountInfo(ataKey);
  const ata = await ataPromise;

  if (!ata) {
    ixes.push(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        ataKey,
        wallet.publicKey,
        mint
      )
    );
  }

  const withdrawIx = isBase
    ? await withdrawBase(
        program,
        wallet.publicKey,
        exchangeKey,
        mint,
        ataKey,
        amount
      )
    : await withdrawTarget(
        program,
        wallet.publicKey,
        exchangeKey,
        mint,
        ataKey,
        amount
      );
  ixes.push(withdrawIx);

  return ixes;
};
