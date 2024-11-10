import { useCallback, useEffect, useRef, useState } from "react";
import { useRecoilCallback, useSetRecoilState } from "recoil";
import _uniqBy from "lodash/uniqBy";
import { useClpVaultProgram } from "./useClpVaultProgram";
import {
  clpVaultAtomFamily,
  getMultipleMints,
  getMultipleTokenAccounts,
  getMultipleTokenMetadata,
  useAppendClpVaultKey,
  useUpdateClpVaults,
  useUpdateSplMints,
  useUpdateSplTokenAccounts,
  useUpdateTokenMetadata,
  useUpdateWhirlpoolPositions,
  useUpdateWhirlpoolTickData,
  useUpdateWhirlpools,
  whirlpoolAtomFamily,
} from "../../state";
import { useWhirlpoolClient } from "../useWhirlpoolFetcher";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { Account, Mint } from "@solana/spl-token";
import { useTokens } from "../useTokens";
import { useLoadSplAccountsForClpVaults } from "../useLoadSplAccounts";
import { VaultPosition } from "../../utils/types";
import {
  IGNORE_CACHE,
  Position,
  Whirlpool,
  WhirlpoolData,
} from "@orca-so/whirlpools-sdk";
import { ClpVaultStruct } from "@mithraic-labs/clp-vault";

export const useLoadClpVault = (clpKey: string) => {
  const lockRef = useRef(false);
  const loadClpVaultData = useLoadClpVaultFunc(clpKey);
  const [loading, setLoading] = useState(!!clpKey);

  useEffect(() => {
    if (!clpKey || lockRef.current) {
      return;
    }
    lockRef.current = true;
    (async () => {
      try {
        await loadClpVaultData();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        lockRef.current = false;
      }
    })();
  }, [clpKey, loadClpVaultData]);

  return loading;
};

export const useLoadClpVaultFunc = (clpKey: string) => {
  const clpVaultProgram = useClpVaultProgram();
  const setClpVault = useSetRecoilState(clpVaultAtomFamily(clpKey));
  const setWhirlpool = useRecoilCallback(
    ({ set }) =>
      (whirlpoolKey: string, whirlpool: WhirlpoolData) => {
        set(whirlpoolAtomFamily(whirlpoolKey), whirlpool);
      },
    []
  );
  const appendVaultKey = useAppendClpVaultKey();
  const whirlpoolClient = useWhirlpoolClient();
  const { connection } = useConnection();
  const updateTokenAccounts = useUpdateSplTokenAccounts();

  return useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const _prevClpVault = snapshot
          .getLoadable(clpVaultAtomFamily(clpKey))
          .getValue();

        const clpVaultPromise = clpVaultProgram.account.clpVault.fetch(clpKey);
        let clpVault: ClpVaultStruct;
        let whirlpool: Whirlpool;
        let tokenAccounts: (Account | null)[];
        if (_prevClpVault) {
          // fire all at once if we already have the static CLP data
          [clpVault, whirlpool, tokenAccounts] = await Promise.all([
            clpVaultPromise,
            whirlpoolClient.getPool(_prevClpVault.clp, IGNORE_CACHE),
            getMultipleTokenAccounts(connection, [
              _prevClpVault.tokenVaultA,
              _prevClpVault.tokenVaultB,
            ]),
          ]);
        } else {
          // first wait for CLP vault data, then make rest of requests in parallel
          clpVault = await clpVaultPromise;
          [whirlpool, tokenAccounts] = await Promise.all([
            whirlpoolClient.getPool(clpVault.clp, IGNORE_CACHE),
            getMultipleTokenAccounts(connection, [
              clpVault.tokenVaultA,
              clpVault.tokenVaultB,
            ]),
          ]);
        }
        setClpVault(clpVault);
        setWhirlpool(clpVault.clp.toString(), whirlpool.getData());
        appendVaultKey(clpKey);
        updateTokenAccounts(tokenAccounts.filter((a) => !!a) as Account[]);
      },
    [
      appendVaultKey,
      clpKey,
      clpVaultProgram.account.clpVault,
      connection,
      setClpVault,
      setWhirlpool,
      updateTokenAccounts,
      whirlpoolClient,
    ]
  );
};

export const useLoadAllClpVaults = () => {
  const program = useClpVaultProgram();
  const updateClpVaults = useUpdateClpVaults();
  const whirlpoolClient = useWhirlpoolClient();
  const updateTokenAccounts = useUpdateSplTokenAccounts();
  const updateWhirlpools = useUpdateWhirlpools();
  const updateTickData = useUpdateWhirlpoolTickData();
  const updatePositions = useUpdateWhirlpoolPositions();
  const updateSplMints = useUpdateSplMints();
  const updateMetadata = useUpdateTokenMetadata();
  const loadSplAccounts = useLoadSplAccountsForClpVaults();
  const tokens = useTokens();
  const { connection } = useConnection();

  useEffect(() => {
    loadSplAccounts();
  }, [loadSplAccounts]);

  return useCallback(async () => {
    const vaultTokens = [] as PublicKey[];
    const vaultMints = [] as string[];
    const vaultPositions = [] as VaultPosition[];
    const vaults = await program.account.clpVault.all();
    const whirlpoolKeys = vaults.map((v) => {
      vaultTokens.push(v.account.tokenVaultA, v.account.tokenVaultB);
      vaultMints.push(
        v.account.tokenMintA.toString(),
        v.account.tokenMintB.toString(),
        v.account.lpMint.toString()
      );
      vaultPositions.push(...(v.account.positions as VaultPosition[]));
      return v.account.clp;
    });
    const uniqueWhirlpoolKeys = _uniqBy(whirlpoolKeys, (pubkey) =>
      pubkey.toString()
    );

    const activePositionKeys = vaultPositions
      .filter(
        (vaultPosition) => !vaultPosition.positionKey.equals(PublicKey.default)
      )
      .map((activePosition) => activePosition.positionKey);

    // fetch all the things
    const [whirlpools, positions, metadata, mints, tokenAccounts] =
      await Promise.all([
        whirlpoolClient.getPools(uniqueWhirlpoolKeys, IGNORE_CACHE),
        whirlpoolClient.getPositions(activePositionKeys, IGNORE_CACHE),
        getMultipleTokenMetadata(connection, tokens, vaultMints),
        getMultipleMints(
          connection,
          vaultMints.map((m) => new PublicKey(m))
        ),
        getMultipleTokenAccounts(connection, vaultTokens),
      ]);

    updatePositions(
      (Object.values(positions).filter((p) => !!p) as Position[]).map((p) => [
        p.getAddress().toString(),
        p.getData(),
      ])
    );
    updateTickData(
      (Object.values(positions).filter((p) => !!p) as Position[]).map((p) => [
        p.getAddress().toString(),
        {
          lowerTickData: p.getLowerTickData(),
          upperTickData: p.getUpperTickData(),
        },
      ])
    );
    updateMetadata(metadata);
    updateWhirlpools(
      whirlpools.map((w) => [w.getAddress().toString(), w.getData()])
    );
    updateSplMints(mints.filter((m) => !!m) as Mint[]);
    updateTokenAccounts(tokenAccounts.filter((a) => !!a) as Account[]);
    updateClpVaults(
      vaults.map(({ publicKey, account }) => [publicKey.toString(), account])
    );
  }, [
    connection,
    program.account.clpVault,
    tokens,
    updateClpVaults,
    updateMetadata,
    updatePositions,
    updateSplMints,
    updateTickData,
    updateTokenAccounts,
    updateWhirlpools,
    whirlpoolClient,
  ]);
};
