import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import {
  ClaimableRewards,
  PsyStakePool,
  PsyStakeRewardPool,
  PsyStakeRecord,
} from "../state";
import { Program } from "@coral-xyz/anchor";
import { PsyStake } from "./psyStakeIdl";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { StakingRecordWithKeyAndVaultId } from "./types";
import { Decimal } from "./decimal";

export const deriveAllocatedTokenAccount = (
  programId: PublicKey,
  rewardPool: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [rewardPool.toBuffer(), Buffer.from("AllocatedTokenAccount")],
    programId
  );
};

export const deriveStakingRecord = (
  programId: PublicKey,
  recordOwner: PublicKey,
  stakePool: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [
      recordOwner.toBuffer(),
      stakePool.toBuffer(),
      Buffer.from("StakingRecord"),
    ],
    programId
  );
};

export const deriveRewardPool = (
  programId: PublicKey,
  stakePool: PublicKey,
  poolId: number
) => {
  return PublicKey.findProgramAddressSync(
    [
      new BN(poolId).toArrayLike(Buffer, "le", 1),
      stakePool.toBuffer(),
      Buffer.from("RewardPool"),
    ],
    programId
  );
};

export const deriveRewardRecord = (
  programId: PublicKey,
  rewardPool: PublicKey,
  rewardEpoch: number
) => {
  return PublicKey.findProgramAddressSync(
    [
      rewardPool.toBuffer(),
      new BN(rewardEpoch).toArrayLike(Buffer, "le", 2),
      Buffer.from("RewardRecord"),
    ],
    programId
  );
};

export async function fetchStakingRecords(
  stakePools: {
    stakePool: PsyStakePool & {
      publicKey: PublicKey;
    };
    vaultId: string;
  }[],
  program: Program<PsyStake>,
  wallet: AnchorWallet
): Promise<StakingRecordWithKeyAndVaultId[] | null> {
  if (!program || !stakePools.length || !wallet || !wallet.publicKey)
    return null;
  const vaultsByStakingRecordKeys = new Map<PublicKey, string>();
  for (const { stakePool, vaultId } of stakePools) {
    if (!stakePool) continue;
    const [stakingRecordKey] = deriveStakingRecord(
      program.programId,
      wallet.publicKey,
      stakePool.publicKey
    );
    vaultsByStakingRecordKeys.set(stakingRecordKey, vaultId);
  }
  const stakingRecordKeysArr = Array.from(vaultsByStakingRecordKeys.keys());
  try {
    const stakingRecordAccountsInfo =
      await program.account.stakingRecord.fetchMultiple(stakingRecordKeysArr);
    if (!stakingRecordAccountsInfo) return null;
    return stakingRecordAccountsInfo
      .map((accInfo, index) => {
        if (!accInfo) return null;
        const stakingRecordKey = stakingRecordKeysArr[index];

        return {
          stakingRecord: accInfo as PsyStakeRecord,
          key: stakingRecordKey,
          clpVaultId: vaultsByStakingRecordKeys.get(stakingRecordKey),
        } as StakingRecordWithKeyAndVaultId;
      })
      .filter(
        (decoded): decoded is StakingRecordWithKeyAndVaultId => !!decoded
      );
  } catch (err) {
    console.error(
      "Error fetching StakingRecords: ",
      stakingRecordKeysArr.toString()
    );
    return null;
  }
}

// TODO combine RPC calls from `getRewardRecordData` into batch
export async function fetchRewardClaims(
  rewardToken: {
    mintAddress: string;
    decimals: number;
  },
  rewardPoolKeyString: string,
  poolId: number,
  epochRewardDecimals: number,
  stakingRecord: PsyStakeRecord,
  stakePool: PsyStakePool,
  program: Program<PsyStake>
): Promise<ClaimableRewards> {
  const claimableRewards: ClaimableRewards = {};
  const epochsToClaimForPool = getEpochsToClaimForPool(
    poolId,
    stakingRecord,
    stakePool
  );

  if (!epochsToClaimForPool?.length) {
    return claimableRewards;
  }

  const [startClaimEpoch, endClaimEpoch] = epochsToClaimForPool;

  const [startRewardRecordData, endRewardRecordData] = await Promise.all([
    getRewardRecordData(program, rewardPoolKeyString, startClaimEpoch),
    getRewardRecordData(program, rewardPoolKeyString, endClaimEpoch),
  ]);
  let amountPerRewardUnit = new Decimal(0);
  if (startRewardRecordData && endRewardRecordData) {
    if (startClaimEpoch === endClaimEpoch) {
      // amountPerRewardUnit == cummulative of startClaimEpoch.
      amountPerRewardUnit = new Decimal(
        startRewardRecordData?.cummulativeReward.toNumber() ?? 0
      ).div(10 ** epochRewardDecimals);
    } else {
      // amountPerRewardUnit == cummulative of end - startClaimEpoch.
      amountPerRewardUnit = new Decimal(
        (endRewardRecordData?.cummulativeReward.toNumber() ?? 0) -
          startRewardRecordData.cummulativeReward.toNumber()
      ).div(10 ** epochRewardDecimals);
    }
  }
  const claimableAmount = amountPerRewardUnit
    .mul(stakingRecord.rewardUnits.toNumber())
    .floor()
    .div(10 ** rewardToken.decimals)
    .toNumber();

  if (!claimableRewards[rewardToken.mintAddress]) {
    claimableRewards[rewardToken.mintAddress] = {
      totalClaimableAmount: claimableAmount,
      epochsToClaim: {
        [poolId]: epochsToClaimForPool,
      },
      decimals: rewardToken.decimals,
    };
  } else {
    claimableRewards[rewardToken.mintAddress]["totalClaimableAmount"] +=
      claimableAmount;
    claimableRewards[rewardToken.mintAddress]["epochsToClaim"][poolId] =
      epochsToClaimForPool;
  }
  return claimableRewards;
}

export const getEpochsToClaimForPool = (
  poolId: number,
  stakingRecord: PsyStakeRecord,
  stakePool: PsyStakePool
) => {
  const poolIdx = poolId - 1;
  const { currentEpoch } = stakePool;
  // No epochs to claim if stakingRecord does not exist.
  if (!stakingRecord || !currentEpoch || !stakePool) return;

  // Epoch at which RewardPool becomes inactive.
  const inactiveEpoch = stakePool.inactiveEpochVec[poolIdx];
  // Epoch at which RewardPool starts.
  const startingEpoch = stakePool.startingEpochVec[poolIdx];
  // The last epoch which was claimed.
  const lastEpochClaimed = stakingRecord.lastEpochClaimedVec[poolIdx];

  // Epoch to pass to instruction as the start epoch, to be used
  // for retrieving the cummulativeReward up to this epoch.
  // This should either be the last epoch claimed or the starting epoch
  // of the RewardPool (if it is later).
  // Note that only rewards from the next epoch after this will be claimed.
  const startClaimEpoch = Math.max(lastEpochClaimed, startingEpoch);

  // Epoch to pass to instruction as the end epoch, to be used
  // for retrieving the cummulativeReward up to this epoch.
  // This should either be the last completed epoch or the epoch in which
  // RewardPool became inactive (if it is earlier).
  // Note that rewards between startClaimEpoch+1 to endClaimEpoch (inclusive)
  // will be claimed.
  const endClaimEpoch =
    inactiveEpoch > 0
      ? Math.min(currentEpoch - 1, inactiveEpoch)
      : currentEpoch - 1;

  const hasRewardPoolCompletedAnEpoch = startingEpoch < currentEpoch;

  if (
    !hasRewardPoolCompletedAnEpoch ||
    // Cannot start claiming from an epoch later than the end claim.
    startClaimEpoch > endClaimEpoch ||
    // Can only set startClaimEpoch as endClaimEpoch, if
    // it is the starting epoch of the RewardPool.
    (startClaimEpoch === endClaimEpoch && startClaimEpoch !== startingEpoch) ||
    // End claim epoch cannot already be claimed.
    lastEpochClaimed >= endClaimEpoch
  ) {
    // nothing to claim
    return;
  }
  return [startClaimEpoch, endClaimEpoch];
};

async function getRewardRecordData(
  program: Program<PsyStake>,
  rewardPoolKeyString: string,
  epoch: number
) {
  const rewardPoolKey = new PublicKey(rewardPoolKeyString);
  const [rewardRecord] = deriveRewardRecord(
    program.programId,
    rewardPoolKey,
    epoch
  );
  let retries = 0;
  let rewardRecordData;
  do {
    try {
      rewardRecordData = await program.account.rewardRecord.fetch(
        rewardRecord,
        "confirmed"
      );
    } catch (err) {
      retries++;
      console.error("Error fetching RewardRecord: ", rewardRecord.toString());
    }
  } while (!rewardRecordData && retries < 5);
  return rewardRecordData;
}

export async function fetchRewardPools(
  derivedRewardPools: {
    [rewardPool: string]: string;
  },
  program: Program<PsyStake>
): Promise<{ [stakePool: string]: PsyStakeRewardPool[] }> {
  const rewardPoolIds = Array.from(Object.keys(derivedRewardPools));
  if (!program || !rewardPoolIds.length) return {};
  try {
    const rewardPools = await program.account.rewardPool.fetchMultiple(
      rewardPoolIds,
      "confirmed"
    );
    const rewardPoolsByStakePool = {} as {
      [stakePool: string]: PsyStakeRewardPool[];
    };
    rewardPools.forEach((accInfo, index) => {
      if (!accInfo) return null;
      const rewardPoolKey = rewardPoolIds[index];
      const stakePoolKey = derivedRewardPools[rewardPoolKey];
      if (!rewardPoolsByStakePool[stakePoolKey]) {
        rewardPoolsByStakePool[stakePoolKey] = [accInfo];
      } else {
        rewardPoolsByStakePool[stakePoolKey].push(accInfo);
      }
    });
    return rewardPoolsByStakePool;
  } catch (err) {
    console.error("Error fetching Reward Pools: ", rewardPoolIds.toString());
    return {};
  }
}
