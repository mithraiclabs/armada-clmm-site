import { useRecoilValue } from "recoil";
import {
  explorerAtom,
  selectTokenASymbol,
  selectTokenBSymbol,
} from "../../../state";
import { format } from "date-fns";
import { SimpleCard } from "../../common/SimpleCard";
import { selectVaultEventHistory } from "../../../state/misc/selectors";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { Explorers } from "../../../utils/types";

export const EventHistory = () => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const history = useRecoilValue(selectVaultEventHistory(clpKey));
  const explorer = useRecoilValue(explorerAtom);
  const tokenBSymbol = useRecoilValue(selectTokenBSymbol(clpKey));
  const tokenASymbol = useRecoilValue(selectTokenASymbol(clpKey));
  return (
    <SimpleCard contentClassName="max-h-[500px] overflow-auto">
      <p className=" font-khand text-text-placeholder text-2xl font-semibold">
        Event History
      </p>
      <div>
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Wallet</th>
              <th>{tokenASymbol}</th>
              <th>{tokenBSymbol}</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {history.map((d) => {
              switch (d.eventName) {
                case "DepositEvent":
                case "WithdrawEvent":
                  return (
                    <tr className=" text-center" key={d.chainTime._seconds}>
                      <td className="p-2 pb-3">
                        {d.eventName === "DepositEvent"
                          ? "Deposit"
                          : "Withdraw"}
                      </td>
                      <td className="p-2 pb-3 min-w-[100px]">
                        <a
                          href={Explorers[explorer].accountLink(d.user, false)}
                          target="_blank"
                        >
                          {d.user.slice(0, 10)}...{d.user.slice(36, 45)}
                        </a>
                      </td>
                      <td className="p-2 pb-3 min-w-[100px]">{d.a}</td>
                      <td className="p-2 pb-3 min-w-[100px]">{d.b}</td>
                      <td className="p-2 pb-3 min-w-[50px]">
                        {format(
                          d.chainTime._seconds * 1000,
                          "MMM d, yyyy-HH:mmaa"
                        )}
                      </td>
                    </tr>
                  );
                default:
                  return null;
              }
            })}
          </tbody>
        </table>
      </div>
    </SimpleCard>
  );
};
