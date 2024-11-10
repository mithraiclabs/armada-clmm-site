export type PsyStake = {
  version: "0.1.4";
  name: "psy_stake";
  instructions: [
    {
      name: "createStakePool";
      accounts: [
        {
          name: "stakePoolAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakingTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakingTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "uniqueSeed";
          type: "u16";
        },
        {
          name: "nextEpochStartTime";
          type: "i64";
        },
        {
          name: "epochDuration";
          type: "i64";
        }
      ];
    },
    {
      name: "createStakePoolV2";
      accounts: [
        {
          name: "stakePoolAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakingTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakingTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "uniqueSeed";
          type: "u16";
        },
        {
          name: "nextEpochStartTime";
          type: "i64";
        },
        {
          name: "epochDuration";
          type: "i64";
        },
        {
          name: "rewardMultipliers";
          type: {
            array: ["u16", 5];
          };
        }
      ];
    },
    {
      name: "updateStakePool";
      accounts: [
        {
          name: "stakePoolAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "lockupDisabled";
          type: "bool";
        }
      ];
    },
    {
      name: "createRewardPool";
      accounts: [
        {
          name: "stakePoolAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "rewardPoolAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardPool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rewardTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "allocatedTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "startingEpoch";
          type: "u16";
        },
        {
          name: "distributionType";
          type: {
            defined: "DistributionType";
          };
        },
        {
          name: "rewardPerEpoch";
          type: "u64";
        },
        {
          name: "epochRewardDecimals";
          type: "u8";
        }
      ];
    },
    {
      name: "updateRewardPool";
      accounts: [
        {
          name: "rewardPoolAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardPool";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "distributionType";
          type: {
            defined: "DistributionType";
          };
        },
        {
          name: "rewardPerEpoch";
          type: "u64";
        },
        {
          name: "isActive";
          type: "bool";
        }
      ];
    },
    {
      name: "resetRewardUnits";
      accounts: [
        {
          name: "recordOwner";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakingRecord";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "transferUnallocatedRewards";
      accounts: [
        {
          name: "rewardPoolAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "rewardPool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "destinationTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "createStakingRecord";
      docs: ["Invokable by stakers."];
      accounts: [
        {
          name: "recordOwner";
          isMut: true;
          isSigner: true;
        },
        {
          name: "stakePool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakingRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "stakeToken";
      accounts: [
        {
          name: "recordOwner";
          isMut: false;
          isSigner: true;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakingRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "ownerTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakingTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
        {
          name: "lockupPeriod";
          type: "u8";
        }
      ];
    },
    {
      name: "unstakeToken";
      accounts: [
        {
          name: "recordOwner";
          isMut: false;
          isSigner: true;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakingRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "ownerTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakingTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "claimReward";
      accounts: [
        {
          name: "recordOwner";
          isMut: false;
          isSigner: true;
        },
        {
          name: "stakePool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakingRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardPool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "startRewardRecord";
          isMut: false;
          isSigner: false;
        },
        {
          name: "endRewardRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "ownerTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "allocatedTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "changeStakingRecord";
      accounts: [
        {
          name: "recordOwner";
          isMut: true;
          isSigner: true;
        },
        {
          name: "newRecordOwner";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakePool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "newStakingRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "oldStakingRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "ownershipRecord";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "verifyOwnershipRecord";
      accounts: [
        {
          name: "newRecordOwner";
          isMut: true;
          isSigner: true;
        },
        {
          name: "recordOwner";
          isMut: false;
          isSigner: false;
        },
        {
          name: "ownershipRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakePool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "oldStakingRecord";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "stakeAdditionalToken";
      accounts: [
        {
          name: "recordOwner";
          isMut: false;
          isSigner: true;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakingRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "ownerTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakingTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "createRewardRecord";
      docs: ["Invokable by permissionless cranks."];
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "stakePool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rewardPool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "newRewardRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "prevRewardRecord";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rewardTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "allocatedTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "updateRewardRecord";
      accounts: [
        {
          name: "stakePool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rewardPool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "curRewardRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "prevRewardRecord";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rewardTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "allocatedTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "updateStakePoolEpoch";
      accounts: [
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "stakeByVault";
      docs: ["Invokable by vault program."];
      accounts: [
        {
          name: "vaultAccount";
          isMut: false;
          isSigner: true;
        },
        {
          name: "stakingTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakingRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "ownerTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakingTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
        {
          name: "lockupPeriod";
          type: "u8";
        }
      ];
    },
    {
      name: "claimRewardByVault";
      accounts: [
        {
          name: "vaultAccount";
          isMut: false;
          isSigner: true;
        },
        {
          name: "stakingTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakePool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakingRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardPool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "startRewardRecord";
          isMut: false;
          isSigner: false;
        },
        {
          name: "endRewardRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "allocatedTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "ownerTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "stakePool";
      docs: [
        "Allocated Size = 770 bytes, incl. buffer.",
        "Estimated Rent = 0.00625008 SOL",
        "Current Size = (32 * 3 + 4 + 2 * 2 + 8 * 3 + 2 * 50 * 2 + 5 * 2) + 8 bytes discriminator.",
        "= 346 bytes"
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "stakePoolAuthority";
            docs: ["Priviledged account."];
            type: "publicKey";
          },
          {
            name: "stakingTokenMint";
            docs: ["Mint of token to be staked in this pool."];
            type: "publicKey";
          },
          {
            name: "stakingTokenAccount";
            docs: ["Address of token account for storing staking token."];
            type: "publicKey";
          },
          {
            name: "rewardPoolCount";
            docs: ["Number of RewardPools created."];
            type: "u8";
          },
          {
            name: "currentEpoch";
            docs: ["Current epoch of the StakePool. Defaults to 0."];
            type: "u16";
          },
          {
            name: "epochDuration";
            docs: ["Duration of one epoch in seconds."];
            type: "i64";
          },
          {
            name: "nextEpochStartTime";
            docs: ["Start time of the next epoch, in Unix epoch timestamp."];
            type: "i64";
          },
          {
            name: "inactiveEpochVec";
            docs: [
              "Vector storing the last complete epoch in which a RewardPool is active,",
              "indexing by pool_id (starting from pool_id 1)."
            ];
            type: {
              vec: "u16";
            };
          },
          {
            name: "startingEpochVec";
            docs: [
              "Vector storing the starting epoch of a RewardPool,",
              "indexing by pool_id (starting from pool_id 1)."
            ];
            type: {
              vec: "u16";
            };
          },
          {
            name: "totalRewardUnits";
            docs: [
              "Sum of all staked pool tokens (in native units) multiplied by respective reward multipliers."
            ];
            type: "u64";
          },
          {
            name: "stakePoolBump";
            docs: ["Bump to derive the program-derived address of StakePool."];
            type: "u8";
          },
          {
            name: "stakingTokenAccountBump";
            docs: [
              "Bump to derive the program-derived address of staking_token_account."
            ];
            type: "u8";
          },
          {
            name: "uniqueSeed";
            docs: ["Unique seed for PDA derivation."];
            type: "u16";
          },
          {
            name: "lockupDisabled";
            docs: [
              "Whether lockup period is disabled. When disabled, all unstaking will be allowed."
            ];
            type: "bool";
          },
          {
            name: "rewardMultipliers";
            docs: ["The reward multipliers for a stake pool"];
            type: {
              array: ["u16", 5];
            };
          }
        ];
      };
    },
    {
      name: "rewardPool";
      docs: [
        "Allocated Size = 300 bytes, incl. buffer.",
        "Estimated Rent = 0.00297888 SOL",
        "Current Size = (32 * 5 + 8 * 2 + 1 * 7 + 2) + 8 bytes discriminator.",
        "= 193 bytes"
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "stakePool";
            type: "publicKey";
          },
          {
            name: "rewardPoolAuthority";
            docs: ["Priviledged account."];
            type: "publicKey";
          },
          {
            name: "poolId";
            docs: [
              "Id starting from 1, incrementing by one for each RewardPool created under a StakePool."
            ];
            type: "u8";
          },
          {
            name: "rewardTokenMint";
            docs: ["Mint of token to be rewarded."];
            type: "publicKey";
          },
          {
            name: "rewardTokenAccount";
            docs: [
              "Address of token account for storing unallocated reward tokens."
            ];
            type: "publicKey";
          },
          {
            name: "allocatedTokenAccount";
            docs: [
              "Address of token account for storing allocated reward tokens."
            ];
            type: "publicKey";
          },
          {
            name: "distributionType";
            docs: [
              "Enum matching to the distribution strategy of this RewardPool."
            ];
            type: {
              defined: "DistributionType";
            };
          },
          {
            name: "constantRewardPerEpoch";
            docs: [
              "Amount of reward token to distribute per epoch, in native units."
            ];
            type: "u64";
          },
          {
            name: "percentageRewardMbpsPerEpoch";
            docs: ["Percentage of reward token to distribute per epoch."];
            type: "u64";
          },
          {
            name: "startingEpoch";
            docs: [
              "Epoch to start emission of reward tokens. This should not be modified."
            ];
            type: "u16";
          },
          {
            name: "isActive";
            docs: [
              "Once this is set to false, it should not be set to true again."
            ];
            type: "bool";
          },
          {
            name: "epochRewardDecimals";
            docs: [
              "Decimals for epoch_reward and cummulative_reward in RewardRecord."
            ];
            type: "u8";
          },
          {
            name: "rewardPoolBump";
            docs: ["Bump to derive the program-derived address of RewardPool."];
            type: "u8";
          },
          {
            name: "rewardTokenAccountBump";
            docs: [
              "Bump to derive the program-derived address of reward_token_account."
            ];
            type: "u8";
          },
          {
            name: "allocatedTokenAccountBump";
            docs: [
              "Bump to derive the program-derived address of allocated_token_account."
            ];
            type: "u8";
          }
        ];
      };
    },
    {
      name: "stakingRecord";
      docs: [
        "Allocated Size = 400 bytes, incl. buffer.",
        "Estimated Rent = 0.00367488 SOL",
        "Current Size = (32 * 2 + 8 * 3 + 1 + 2 * 50) + 8 bytes discriminator.",
        "= 197 bytes"
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "stakePool";
            type: "publicKey";
          },
          {
            name: "recordOwner";
            docs: [
              "Owner of staked tokens and recipient of reward tokens associated to record."
            ];
            type: "publicKey";
          },
          {
            name: "stakedAmount";
            docs: ["Amount of tokens staked."];
            type: "u64";
          },
          {
            name: "rewardUnits";
            docs: ["Equivalent to tokens staked * reward multiplier."];
            type: "u64";
          },
          {
            name: "lockUpExpiry";
            docs: ["Unix epoch timestamp for lockup expiry."];
            type: "i64";
          },
          {
            name: "lastEpochClaimedVec";
            docs: [
              "Vector storing the last epoch of a RewardPool for which rewards were",
              "claimed, indexing by pool_id (starting from pool_id 1)."
            ];
            type: {
              vec: "u16";
            };
          },
          {
            name: "recordBump";
            docs: [
              "Bump to derive the program-derived address of StakingRecord."
            ];
            type: "u8";
          }
        ];
      };
    },
    {
      name: "rewardRecord";
      docs: [
        "Allocated Size = 140 bytes, incl. buffer.",
        "Estimated Rent = 0.00186528 SOL",
        "Current Size = (32 * 2 + 8 * 5 + 1 * 2 + 2) + 8 bytes discriminator.",
        "= 116 bytes"
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "stakePool";
            type: "publicKey";
          },
          {
            name: "rewardPool";
            type: "publicKey";
          },
          {
            name: "epoch";
            type: "u16";
          },
          {
            name: "lastUpdated";
            docs: ["Unix epoch timestamp when RewardRecord was last updated."];
            type: "i64";
          },
          {
            name: "epochEndTimestamp";
            docs: ["Unix epoch timestamp of when the epoch ends."];
            type: "i64";
          },
          {
            name: "cummulativeReward";
            docs: [
              "Amount of reward token accumulated per reward unit since the first reward epoch, in epoch_reward_decimals."
            ];
            type: "u64";
          },
          {
            name: "epochReward";
            docs: [
              "Amount of reward token per reward unit allocated for this epoch, in epoch_reward_decimals."
            ];
            type: "u64";
          },
          {
            name: "totalRewardAllocated";
            docs: [
              "Total amount of reward token allocated this epoch, in native units."
            ];
            type: "u64";
          },
          {
            name: "recordBump";
            docs: [
              "Bump to derive the program-derived address of RewardRecord."
            ];
            type: "u8";
          },
          {
            name: "isUpdatable";
            docs: [
              "If RewardRecord is allow to be updated. Defaults to true.",
              "Set to false once rewards are claimed with this as the ending RewardRecord."
            ];
            type: "bool";
          }
        ];
      };
    },
    {
      name: "ownershipRecord";
      docs: [
        "Allocated Size = 100 bytes, incl. buffer.",
        "Estimated Rent = 0.00158688 SOL",
        "Current SIze = (32 * 2 + 1) + 8 bytes discriminator.",
        "= 73 bytes."
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "oldRecordOwner";
            docs: ["The original record owner for the staking record"];
            type: "publicKey";
          },
          {
            name: "newRecordOwner";
            docs: [
              "The new record owner to whom the ownership is to be transferred to"
            ];
            type: "publicKey";
          },
          {
            name: "bump";
            docs: ["Bump to derive the PDA of OwnershipRecord"];
            type: "u8";
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "DistributionType";
      docs: ["Size = 1 byte."];
      type: {
        kind: "enum";
        variants: [
          {
            name: "Constant";
          },
          {
            name: "Percentage";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "InvalidStartTime";
      msg: "Start time of next epoch must be in the future.";
    },
    {
      code: 6001;
      name: "MinEpochDuration";
      msg: "Epoch duration must be at least 4 hours.";
    },
    {
      code: 6002;
      name: "InvalidStartingEpoch";
      msg: "Starting epoch of RewardPool cannot be in the past.";
    },
    {
      code: 6003;
      name: "InvalidPreviousRecord";
      msg: "Previous record must be from one epoch before current record.";
    },
    {
      code: 6004;
      name: "InvalidDistributionType";
      msg: "Distribution type is not supported.";
    },
    {
      code: 6005;
      name: "InvalidPercentage";
      msg: "Percentage chosen is invalid.";
    },
    {
      code: 6006;
      name: "RewardPoolsLimit";
      msg: "Max. no. of RewardPool per stake pool has been reached.";
    },
    {
      code: 6007;
      name: "RewardPoolInactive";
      msg: "RewardPool is no longer active.";
    },
    {
      code: 6008;
      name: "RewardRecordEpochConstraint";
      msg: "RewardRecord cannot be created for future epochs.";
    },
    {
      code: 6009;
      name: "LastUpdateMoreRecent";
      msg: "RewardRecord cannot be updated as last update was more recent to epoch end.";
    },
    {
      code: 6010;
      name: "EpochHasNotEnded";
      msg: "The current epoch has not ended.";
    },
    {
      code: 6011;
      name: "InsufficientAmount";
      msg: "Insufficient amount for staking or unstaking.";
    },
    {
      code: 6012;
      name: "InvalidLockupPeriod";
      msg: "Invalid lockup period selected.";
    },
    {
      code: 6013;
      name: "LockupPeriodTooShort";
      msg: "Selected lockup period is too short.";
    },
    {
      code: 6014;
      name: "LockupHasNotExpire";
      msg: "Lockup period has not expire.";
    },
    {
      code: 6015;
      name: "UnclaimedRewardPool";
      msg: "Some RewardPool is unclaimed.";
    },
    {
      code: 6016;
      name: "EndRecordMustBeSameOrNewer";
      msg: "End RewardRecord must be from the same or later epoch than start RewardRecord.";
    },
    {
      code: 6017;
      name: "NoRewardsAvailable";
      msg: "No rewards available for claiming.";
    },
    {
      code: 6018;
      name: "InvalidStartRewardRecord";
      msg: "Start RewardRecord should be from the last epoch claimed.";
    },
    {
      code: 6019;
      name: "RewardAlreadyClaimed";
      msg: "Reward has already been claimed.";
    },
    {
      code: 6020;
      name: "RewardPoolHasNotStarted";
      msg: "Cannot change a RewardPool to inactive before it starts.";
    },
    {
      code: 6021;
      name: "OwnerTokenAccountInvalid";
      msg: "Owner token account is invalid.";
    },
    {
      code: 6022;
      name: "RewardRecordCannotBeUpdated";
      msg: "RewardRecord is not updatable.";
    },
    {
      code: 6023;
      name: "InvalidSigner";
      msg: "Signer of transaction must be an authorized vault account.";
    },
    {
      code: 6024;
      name: "DecimalsLimit";
      msg: "Limit of decimals allowed has been exceeded.";
    },
    {
      code: 6025;
      name: "StakedAmountZero";
      msg: "Staked amount cannot be zero";
    },
    {
      code: 6026;
      name: "LockupExpired";
      msg: "The lockup has already expired. Please unstake your position instead of changing to a new record owner.";
    }
  ];
};

export const IDL: PsyStake = {
  version: "0.1.4",
  name: "psy_stake",
  instructions: [
    {
      name: "createStakePool",
      accounts: [
        {
          name: "stakePoolAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakingTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakingTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "uniqueSeed",
          type: "u16",
        },
        {
          name: "nextEpochStartTime",
          type: "i64",
        },
        {
          name: "epochDuration",
          type: "i64",
        },
      ],
    },
    {
      name: "createStakePoolV2",
      accounts: [
        {
          name: "stakePoolAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakingTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakingTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "uniqueSeed",
          type: "u16",
        },
        {
          name: "nextEpochStartTime",
          type: "i64",
        },
        {
          name: "epochDuration",
          type: "i64",
        },
        {
          name: "rewardMultipliers",
          type: {
            array: ["u16", 5],
          },
        },
      ],
    },
    {
      name: "updateStakePool",
      accounts: [
        {
          name: "stakePoolAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "lockupDisabled",
          type: "bool",
        },
      ],
    },
    {
      name: "createRewardPool",
      accounts: [
        {
          name: "stakePoolAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "rewardPoolAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardPool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rewardTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "allocatedTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "startingEpoch",
          type: "u16",
        },
        {
          name: "distributionType",
          type: {
            defined: "DistributionType",
          },
        },
        {
          name: "rewardPerEpoch",
          type: "u64",
        },
        {
          name: "epochRewardDecimals",
          type: "u8",
        },
      ],
    },
    {
      name: "updateRewardPool",
      accounts: [
        {
          name: "rewardPoolAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardPool",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "distributionType",
          type: {
            defined: "DistributionType",
          },
        },
        {
          name: "rewardPerEpoch",
          type: "u64",
        },
        {
          name: "isActive",
          type: "bool",
        },
      ],
    },
    {
      name: "resetRewardUnits",
      accounts: [
        {
          name: "recordOwner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakingRecord",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "transferUnallocatedRewards",
      accounts: [
        {
          name: "rewardPoolAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "rewardPool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "destinationTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "createStakingRecord",
      docs: ["Invokable by stakers."],
      accounts: [
        {
          name: "recordOwner",
          isMut: true,
          isSigner: true,
        },
        {
          name: "stakePool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakingRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "stakeToken",
      accounts: [
        {
          name: "recordOwner",
          isMut: false,
          isSigner: true,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakingRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "ownerTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakingTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
        {
          name: "lockupPeriod",
          type: "u8",
        },
      ],
    },
    {
      name: "unstakeToken",
      accounts: [
        {
          name: "recordOwner",
          isMut: false,
          isSigner: true,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakingRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "ownerTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakingTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "claimReward",
      accounts: [
        {
          name: "recordOwner",
          isMut: false,
          isSigner: true,
        },
        {
          name: "stakePool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakingRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardPool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "startRewardRecord",
          isMut: false,
          isSigner: false,
        },
        {
          name: "endRewardRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "ownerTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "allocatedTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "changeStakingRecord",
      accounts: [
        {
          name: "recordOwner",
          isMut: true,
          isSigner: true,
        },
        {
          name: "newRecordOwner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakePool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "newStakingRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "oldStakingRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "ownershipRecord",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "verifyOwnershipRecord",
      accounts: [
        {
          name: "newRecordOwner",
          isMut: true,
          isSigner: true,
        },
        {
          name: "recordOwner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "ownershipRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakePool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "oldStakingRecord",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "stakeAdditionalToken",
      accounts: [
        {
          name: "recordOwner",
          isMut: false,
          isSigner: true,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakingRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "ownerTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakingTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "createRewardRecord",
      docs: ["Invokable by permissionless cranks."],
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "stakePool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rewardPool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "newRewardRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "prevRewardRecord",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rewardTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "allocatedTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "updateRewardRecord",
      accounts: [
        {
          name: "stakePool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rewardPool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "curRewardRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "prevRewardRecord",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rewardTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "allocatedTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "updateStakePoolEpoch",
      accounts: [
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "stakeByVault",
      docs: ["Invokable by vault program."],
      accounts: [
        {
          name: "vaultAccount",
          isMut: false,
          isSigner: true,
        },
        {
          name: "stakingTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakingRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "ownerTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakingTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
        {
          name: "lockupPeriod",
          type: "u8",
        },
      ],
    },
    {
      name: "claimRewardByVault",
      accounts: [
        {
          name: "vaultAccount",
          isMut: false,
          isSigner: true,
        },
        {
          name: "stakingTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakePool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakingRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardPool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "startRewardRecord",
          isMut: false,
          isSigner: false,
        },
        {
          name: "endRewardRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "allocatedTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "ownerTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "stakePool",
      docs: [
        "Allocated Size = 770 bytes, incl. buffer.",
        "Estimated Rent = 0.00625008 SOL",
        "Current Size = (32 * 3 + 4 + 2 * 2 + 8 * 3 + 2 * 50 * 2 + 5 * 2) + 8 bytes discriminator.",
        "= 346 bytes",
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "stakePoolAuthority",
            docs: ["Priviledged account."],
            type: "publicKey",
          },
          {
            name: "stakingTokenMint",
            docs: ["Mint of token to be staked in this pool."],
            type: "publicKey",
          },
          {
            name: "stakingTokenAccount",
            docs: ["Address of token account for storing staking token."],
            type: "publicKey",
          },
          {
            name: "rewardPoolCount",
            docs: ["Number of RewardPools created."],
            type: "u8",
          },
          {
            name: "currentEpoch",
            docs: ["Current epoch of the StakePool. Defaults to 0."],
            type: "u16",
          },
          {
            name: "epochDuration",
            docs: ["Duration of one epoch in seconds."],
            type: "i64",
          },
          {
            name: "nextEpochStartTime",
            docs: ["Start time of the next epoch, in Unix epoch timestamp."],
            type: "i64",
          },
          {
            name: "inactiveEpochVec",
            docs: [
              "Vector storing the last complete epoch in which a RewardPool is active,",
              "indexing by pool_id (starting from pool_id 1).",
            ],
            type: {
              vec: "u16",
            },
          },
          {
            name: "startingEpochVec",
            docs: [
              "Vector storing the starting epoch of a RewardPool,",
              "indexing by pool_id (starting from pool_id 1).",
            ],
            type: {
              vec: "u16",
            },
          },
          {
            name: "totalRewardUnits",
            docs: [
              "Sum of all staked pool tokens (in native units) multiplied by respective reward multipliers.",
            ],
            type: "u64",
          },
          {
            name: "stakePoolBump",
            docs: ["Bump to derive the program-derived address of StakePool."],
            type: "u8",
          },
          {
            name: "stakingTokenAccountBump",
            docs: [
              "Bump to derive the program-derived address of staking_token_account.",
            ],
            type: "u8",
          },
          {
            name: "uniqueSeed",
            docs: ["Unique seed for PDA derivation."],
            type: "u16",
          },
          {
            name: "lockupDisabled",
            docs: [
              "Whether lockup period is disabled. When disabled, all unstaking will be allowed.",
            ],
            type: "bool",
          },
          {
            name: "rewardMultipliers",
            docs: ["The reward multipliers for a stake pool"],
            type: {
              array: ["u16", 5],
            },
          },
        ],
      },
    },
    {
      name: "rewardPool",
      docs: [
        "Allocated Size = 300 bytes, incl. buffer.",
        "Estimated Rent = 0.00297888 SOL",
        "Current Size = (32 * 5 + 8 * 2 + 1 * 7 + 2) + 8 bytes discriminator.",
        "= 193 bytes",
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "stakePool",
            type: "publicKey",
          },
          {
            name: "rewardPoolAuthority",
            docs: ["Priviledged account."],
            type: "publicKey",
          },
          {
            name: "poolId",
            docs: [
              "Id starting from 1, incrementing by one for each RewardPool created under a StakePool.",
            ],
            type: "u8",
          },
          {
            name: "rewardTokenMint",
            docs: ["Mint of token to be rewarded."],
            type: "publicKey",
          },
          {
            name: "rewardTokenAccount",
            docs: [
              "Address of token account for storing unallocated reward tokens.",
            ],
            type: "publicKey",
          },
          {
            name: "allocatedTokenAccount",
            docs: [
              "Address of token account for storing allocated reward tokens.",
            ],
            type: "publicKey",
          },
          {
            name: "distributionType",
            docs: [
              "Enum matching to the distribution strategy of this RewardPool.",
            ],
            type: {
              defined: "DistributionType",
            },
          },
          {
            name: "constantRewardPerEpoch",
            docs: [
              "Amount of reward token to distribute per epoch, in native units.",
            ],
            type: "u64",
          },
          {
            name: "percentageRewardMbpsPerEpoch",
            docs: ["Percentage of reward token to distribute per epoch."],
            type: "u64",
          },
          {
            name: "startingEpoch",
            docs: [
              "Epoch to start emission of reward tokens. This should not be modified.",
            ],
            type: "u16",
          },
          {
            name: "isActive",
            docs: [
              "Once this is set to false, it should not be set to true again.",
            ],
            type: "bool",
          },
          {
            name: "epochRewardDecimals",
            docs: [
              "Decimals for epoch_reward and cummulative_reward in RewardRecord.",
            ],
            type: "u8",
          },
          {
            name: "rewardPoolBump",
            docs: ["Bump to derive the program-derived address of RewardPool."],
            type: "u8",
          },
          {
            name: "rewardTokenAccountBump",
            docs: [
              "Bump to derive the program-derived address of reward_token_account.",
            ],
            type: "u8",
          },
          {
            name: "allocatedTokenAccountBump",
            docs: [
              "Bump to derive the program-derived address of allocated_token_account.",
            ],
            type: "u8",
          },
        ],
      },
    },
    {
      name: "stakingRecord",
      docs: [
        "Allocated Size = 400 bytes, incl. buffer.",
        "Estimated Rent = 0.00367488 SOL",
        "Current Size = (32 * 2 + 8 * 3 + 1 + 2 * 50) + 8 bytes discriminator.",
        "= 197 bytes",
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "stakePool",
            type: "publicKey",
          },
          {
            name: "recordOwner",
            docs: [
              "Owner of staked tokens and recipient of reward tokens associated to record.",
            ],
            type: "publicKey",
          },
          {
            name: "stakedAmount",
            docs: ["Amount of tokens staked."],
            type: "u64",
          },
          {
            name: "rewardUnits",
            docs: ["Equivalent to tokens staked * reward multiplier."],
            type: "u64",
          },
          {
            name: "lockUpExpiry",
            docs: ["Unix epoch timestamp for lockup expiry."],
            type: "i64",
          },
          {
            name: "lastEpochClaimedVec",
            docs: [
              "Vector storing the last epoch of a RewardPool for which rewards were",
              "claimed, indexing by pool_id (starting from pool_id 1).",
            ],
            type: {
              vec: "u16",
            },
          },
          {
            name: "recordBump",
            docs: [
              "Bump to derive the program-derived address of StakingRecord.",
            ],
            type: "u8",
          },
        ],
      },
    },
    {
      name: "rewardRecord",
      docs: [
        "Allocated Size = 140 bytes, incl. buffer.",
        "Estimated Rent = 0.00186528 SOL",
        "Current Size = (32 * 2 + 8 * 5 + 1 * 2 + 2) + 8 bytes discriminator.",
        "= 116 bytes",
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "stakePool",
            type: "publicKey",
          },
          {
            name: "rewardPool",
            type: "publicKey",
          },
          {
            name: "epoch",
            type: "u16",
          },
          {
            name: "lastUpdated",
            docs: ["Unix epoch timestamp when RewardRecord was last updated."],
            type: "i64",
          },
          {
            name: "epochEndTimestamp",
            docs: ["Unix epoch timestamp of when the epoch ends."],
            type: "i64",
          },
          {
            name: "cummulativeReward",
            docs: [
              "Amount of reward token accumulated per reward unit since the first reward epoch, in epoch_reward_decimals.",
            ],
            type: "u64",
          },
          {
            name: "epochReward",
            docs: [
              "Amount of reward token per reward unit allocated for this epoch, in epoch_reward_decimals.",
            ],
            type: "u64",
          },
          {
            name: "totalRewardAllocated",
            docs: [
              "Total amount of reward token allocated this epoch, in native units.",
            ],
            type: "u64",
          },
          {
            name: "recordBump",
            docs: [
              "Bump to derive the program-derived address of RewardRecord.",
            ],
            type: "u8",
          },
          {
            name: "isUpdatable",
            docs: [
              "If RewardRecord is allow to be updated. Defaults to true.",
              "Set to false once rewards are claimed with this as the ending RewardRecord.",
            ],
            type: "bool",
          },
        ],
      },
    },
    {
      name: "ownershipRecord",
      docs: [
        "Allocated Size = 100 bytes, incl. buffer.",
        "Estimated Rent = 0.00158688 SOL",
        "Current SIze = (32 * 2 + 1) + 8 bytes discriminator.",
        "= 73 bytes.",
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "oldRecordOwner",
            docs: ["The original record owner for the staking record"],
            type: "publicKey",
          },
          {
            name: "newRecordOwner",
            docs: [
              "The new record owner to whom the ownership is to be transferred to",
            ],
            type: "publicKey",
          },
          {
            name: "bump",
            docs: ["Bump to derive the PDA of OwnershipRecord"],
            type: "u8",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "DistributionType",
      docs: ["Size = 1 byte."],
      type: {
        kind: "enum",
        variants: [
          {
            name: "Constant",
          },
          {
            name: "Percentage",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidStartTime",
      msg: "Start time of next epoch must be in the future.",
    },
    {
      code: 6001,
      name: "MinEpochDuration",
      msg: "Epoch duration must be at least 4 hours.",
    },
    {
      code: 6002,
      name: "InvalidStartingEpoch",
      msg: "Starting epoch of RewardPool cannot be in the past.",
    },
    {
      code: 6003,
      name: "InvalidPreviousRecord",
      msg: "Previous record must be from one epoch before current record.",
    },
    {
      code: 6004,
      name: "InvalidDistributionType",
      msg: "Distribution type is not supported.",
    },
    {
      code: 6005,
      name: "InvalidPercentage",
      msg: "Percentage chosen is invalid.",
    },
    {
      code: 6006,
      name: "RewardPoolsLimit",
      msg: "Max. no. of RewardPool per stake pool has been reached.",
    },
    {
      code: 6007,
      name: "RewardPoolInactive",
      msg: "RewardPool is no longer active.",
    },
    {
      code: 6008,
      name: "RewardRecordEpochConstraint",
      msg: "RewardRecord cannot be created for future epochs.",
    },
    {
      code: 6009,
      name: "LastUpdateMoreRecent",
      msg: "RewardRecord cannot be updated as last update was more recent to epoch end.",
    },
    {
      code: 6010,
      name: "EpochHasNotEnded",
      msg: "The current epoch has not ended.",
    },
    {
      code: 6011,
      name: "InsufficientAmount",
      msg: "Insufficient amount for staking or unstaking.",
    },
    {
      code: 6012,
      name: "InvalidLockupPeriod",
      msg: "Invalid lockup period selected.",
    },
    {
      code: 6013,
      name: "LockupPeriodTooShort",
      msg: "Selected lockup period is too short.",
    },
    {
      code: 6014,
      name: "LockupHasNotExpire",
      msg: "Lockup period has not expire.",
    },
    {
      code: 6015,
      name: "UnclaimedRewardPool",
      msg: "Some RewardPool is unclaimed.",
    },
    {
      code: 6016,
      name: "EndRecordMustBeSameOrNewer",
      msg: "End RewardRecord must be from the same or later epoch than start RewardRecord.",
    },
    {
      code: 6017,
      name: "NoRewardsAvailable",
      msg: "No rewards available for claiming.",
    },
    {
      code: 6018,
      name: "InvalidStartRewardRecord",
      msg: "Start RewardRecord should be from the last epoch claimed.",
    },
    {
      code: 6019,
      name: "RewardAlreadyClaimed",
      msg: "Reward has already been claimed.",
    },
    {
      code: 6020,
      name: "RewardPoolHasNotStarted",
      msg: "Cannot change a RewardPool to inactive before it starts.",
    },
    {
      code: 6021,
      name: "OwnerTokenAccountInvalid",
      msg: "Owner token account is invalid.",
    },
    {
      code: 6022,
      name: "RewardRecordCannotBeUpdated",
      msg: "RewardRecord is not updatable.",
    },
    {
      code: 6023,
      name: "InvalidSigner",
      msg: "Signer of transaction must be an authorized vault account.",
    },
    {
      code: 6024,
      name: "DecimalsLimit",
      msg: "Limit of decimals allowed has been exceeded.",
    },
    {
      code: 6025,
      name: "StakedAmountZero",
      msg: "Staked amount cannot be zero",
    },
    {
      code: 6026,
      name: "LockupExpired",
      msg: "The lockup has already expired. Please unstake your position instead of changing to a new record owner.",
    },
  ],
};
