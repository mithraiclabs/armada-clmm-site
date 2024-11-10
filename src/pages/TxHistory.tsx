import { useRecoilValue } from "recoil";
import { SimpleCard } from "../components/common/SimpleCard";
import { useDevnetState } from "../contexts/NetworkProvider";
import { Link } from "react-router-dom";
import { useCallback, useState } from "react";
import { txHistoryStack, devnetTxHistoryStack, explorerAtom } from "../state";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import { Explorers, NetworkOption, TxGroupLog, TxType } from "../utils/types";

export const TxHistory = () => {
  const [network] = useDevnetState();
  const isDevnet = network === NetworkOption.Devnet;
  const txLogs = useRecoilValue(
    isDevnet ? devnetTxHistoryStack : txHistoryStack
  );
  return (
    <div className="place-self-center">
      <div className="flex flex-col">
        {txLogs.map((txLog) => (
          <TxHistoryCard
            key={txLog.timestamp}
            isDevnet={isDevnet}
            txLog={txLog}
          />
        ))}
      </div>
    </div>
  );
};

export const TxHistoryCard = ({
  txLog,
  isDevnet,
}: {
  txLog: TxGroupLog;
  isDevnet: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const ts = new Date(txLog.timestamp);
  const expand = useCallback(() => setExpanded((prev) => !prev), []);
  const explorer = useRecoilValue(explorerAtom);
  return (
    <SimpleCard onClick={expand} className="cursor-pointer w-fit md:w-[600px]">
      <div className="flex flex-row justify-between">
        <div>
          <p>{txLog.action}</p>
          <p className=" text-text-placeholder">{ts.toUTCString()}</p>
        </div>
        {expanded ? (
          <ChevronUpIcon width={30} />
        ) : (
          <ChevronDownIcon width={30} />
        )}
      </div>
      {expanded && (
        <div className="flex flex-col">
          {txLog.signatures.map(({ signature, type }) => {
            return (
              <SimpleCard key={signature} className="flex flex-row">
                <div>
                  <p className="flex text-lg text-text">
                    {typeToDescription(type)}
                  </p>
                </div>
                <Link
                  target="_blank"
                  className="text-primary flex"
                  to={Explorers[explorer].txLink(signature, isDevnet)}
                >
                  Explorer
                </Link>
              </SimpleCard>
            );
          })}
        </div>
      )}
    </SimpleCard>
  );
};

const typeToDescription = (type: TxType) => {
  switch (type) {
    case TxType.clmmDeposit:
      return "CLMM Deposit";
    case TxType.accountsClose:
      return "Accounts Closing";
    case TxType.accountsOpen:
      return "Accounts Creation";
    case TxType.clmmWithdraw:
      return "CLMM Withdraw";
    case TxType.clmmCollectFees:
      return "Collect Fees";
    case TxType.fsoExercise:
      return "Discounted Token Claim";
    case TxType.lbcPurchase:
      return "LBC Token Purchase";
    case TxType.stake:
      return "Stake";
    case TxType.unstake:
      return "Unstake";
    case TxType.swap:
      return "Swap";
    case TxType.fixedRateSwap:
      return "Fixed Rate Conversion";
    case TxType.unknown:
    default:
      return "Transaction";
  }
};
