import { useRecoilTransaction_UNSTABLE } from "recoil";
import { switchboardAggregatorDataAtomFamily } from ".";
import { MultpleAggregatorDataResp } from "../../utils/switchboard";

export const useUpdateSwitchboardAggregatorDatas = () =>
  useRecoilTransaction_UNSTABLE(
    ({ set }) =>
      (aggregatorDatas: MultpleAggregatorDataResp) => {
        aggregatorDatas.forEach(({ pubkey, data }) => {
          set(switchboardAggregatorDataAtomFamily(pubkey.toString()), data);
        });
      },
    []
  );
