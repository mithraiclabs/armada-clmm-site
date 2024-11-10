import {
  Keypair,
  PublicKey,
} from "@solana/web3.js";

/**
 * Checks if a string of comma-seperated numbers is a valid secret key, returning the
 * resulting keypair if it is.
 *
 * Sample valid keypair (all one line, no spaces):
 * 124,111,115,11,43,55,123,234,117,182,149,160,202,210,57,237,172,193,32,122,75,114,1,
 * 10,52,149,172,176,160,206,144,231,57,190,102,120,10,151,171,211,168,151,154,210,102,
 * 50,194,176,164,200,231,247,136,42,66,77,54,1,39,167,107,64,77,192
 * @param s
 * @param verbose - if true, success/fail state outputs to console
 * @returns
 */
export const checkAndGetKeypair = (s: string, verbose: boolean) => {
  if (!s || s.length == 0) {
    if (verbose) {
      console.log("cleared keypair (blank input)");
    }
    return undefined;
  }
  try {
    // Split into an array of numbers
    const arr = s.split(",").map(Number);
    const keypair = Keypair.fromSecretKey(new Uint8Array(arr));
    if (verbose) {
      console.log(
        "success, your keypair with pubkey " + keypair.publicKey + " is valid"
      );
    }
    return keypair;
  } catch {
    const validSampleKeypair = Keypair.generate();
    if (verbose) {
      console.error(
        s +
          " is not a valid raw secret key byte array. " +
          "A valid byte array looks like: " +
          validSampleKeypair.secretKey
      );
    }
    return undefined;
  }
};

/**
 * Checks if a string is a valid Pubkey and returns the resulting Pubkey if it is
 * @param s
 * @param verbose - if true, success/fail state outputs to console
 * @returns
 */
export const checkAndGetPubkey = (s: string, verbose?: boolean) => {
  if (!s || s.length == 0) {
    if (verbose) {
      console.log("cleared pubkey (blank input)");
    }
    return undefined;
  }
  try {
    const key = new PublicKey(s);
    if (verbose) {
      console.log("success, your key " + key + " is valid");
    }
    return key;
  } catch {
    const validSampleKey = PublicKey.default;
    if (verbose) {
      console.error(
        s +
          " is not a valid Pubkey. A valid Pubkey looks like: " +
          validSampleKey.toString()
      );
    }
    return undefined;
  }
};
