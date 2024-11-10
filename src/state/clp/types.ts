export interface ClpAmounts {
  /** Hex representation of Token amount A */
  a: string;
  /** Hex representation of Token amount B */
  b: string;
}

export interface VaultHistory {
  "24hrFees": ClpAmounts;
  "24hrRewards": ClpAmounts;
  "7dayFees": ClpAmounts;
  "7dayRewards": ClpAmounts;
}

export type RateDocument<T> = {
  rate: string;
  vault: string;
  feesA: string;
  feesB: string;
  createdAt: T;
  startTime: T;
  endTime: T;
};

export type FirebaseTimestamp = {
  _seconds: number;
  _nanoseconds: number;
};

export type VaultHistoryResp = Record<string, {
  rateDoc: RateDocument<FirebaseTimestamp>;
}>;
