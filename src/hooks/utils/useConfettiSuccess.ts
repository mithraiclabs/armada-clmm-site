import { useCallback } from "react";
import { confettiAtom } from "../../state";
import { useSetRecoilState } from "recoil";

export const useConfettiSuccess = () => {
  const setIsExploding = useSetRecoilState(confettiAtom);

  return useCallback(() => {
    setIsExploding(true);
  }, [setIsExploding]);
};
