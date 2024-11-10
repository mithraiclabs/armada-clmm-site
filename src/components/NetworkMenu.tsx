import { Listbox, Menu, RadioGroup, Transition } from "@headlessui/react";
import { Fragment, useCallback, useMemo, useState } from "react";
import { Toggle } from "./Toggle";
import { Button } from "./Button";
import { useDevnetState } from "../contexts/NetworkProvider";
import { ReactComponent as GearIcon } from "../assets/icons/profile.svg";
import { TextInput } from "./common/Input";
import { Explorers, NetworkOption } from "../utils/types";
import { Checkbox } from "./common/Checkbox";
import { useRecoilState } from "recoil";
import { annualizeRatesAtom, customPriorityFee, explorerAtom } from "../state";
import { Link } from "react-router-dom";
import { TextButton } from "./Button/TextButton";
import { GitHash } from "./misc/GitHash";
import { NumberInput, SimpleModal } from "./common";
import { ToolTip } from "./common/ToolTip";
import { Debridge } from "./misc/Debridge";

export const NetworkMenu = ({ simple }: { simple?: boolean }) => {
  const [network, setNetwork, customRpc, setCustomRpc] = useDevnetState();
  const [annualized, setAnnualized] = useRecoilState(annualizeRatesAtom);
  const [customVal, setCustomVal] = useState(customRpc);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [debridgeOpen, setDebridgeOpen] = useState(false);
  const [explorer, setExplorer] = useRecoilState(explorerAtom);
  const onSaveCustomRpc = useCallback(async () => {
    if (customVal) {
      if (customVal.startsWith("http://") || customVal.startsWith("https://")) {
        setCustomRpc(customVal);
      } else {
        setCustomRpc("https://" + customVal);
      }
    }
  }, [customVal, setCustomRpc]);

  if (simple)
    return (
      <div className="my-6">
        <RadioGroup value={network} onChange={setNetwork}>
          <RadioGroup.Label>Network</RadioGroup.Label>
          <hr className="border-text-placeholder opacity-50 pb-2" />
          <RadioGroup.Option value={NetworkOption.Mainnet}>
            {({ checked }) => (
              <span className={checked ? " text-primary" : ""}>
                Mainnet {checked ? "✔" : ""}
              </span>
            )}
          </RadioGroup.Option>
          <RadioGroup.Option value={NetworkOption.Devnet}>
            {({ checked }) => (
              <span className={checked ? "text-primary" : ""}>
                Devnet {checked ? "✔" : ""}
              </span>
            )}
          </RadioGroup.Option>
          <RadioGroup.Option value={NetworkOption.Custom}>
            {({ checked }) => (
              <span className={checked ? "text-primary" : ""}>
                Custom {checked ? "✔" : ""}
              </span>
            )}
          </RadioGroup.Option>
        </RadioGroup>

        {network === NetworkOption.Custom && (
          <div className="text-xs space-y-2 mt-2">
            <TextInput
              containerClassName="flex-1"
              aria-multiline={true}
              value={customVal}
              onChange={setCustomVal}
            />
            <Button className="w-full" onClick={onSaveCustomRpc}>
              Save
            </Button>
          </div>
        )}
        <hr className="border-text-placeholder opacity-50 pb-2" />
        <Checkbox
          onChange={setAnnualized}
          value={annualized}
          label="Annualize Rates"
        />
        <hr className="border-text-placeholder opacity-50 " />
        <div className="w-full">
          <Listbox value={explorer} onChange={setExplorer}>
            <Listbox.Button
              className={`border border-text-placeholder w-full text-left pl-1`}
            >
              <span>Explorer: {Explorers[explorer].name}</span>
            </Listbox.Button>
            <Listbox.Options>
              {Object.values(Explorers).map(({ name }, i) => (
                <Listbox.Option
                  key={name}
                  value={i}
                  className={` hover:bg-background-container w-full text-left rounded-md p-2 cursor-pointer ${
                    explorer === i ? " text-primary font-semibold" : ""
                  } `}
                >
                  {name}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Listbox>
        </div>
        <hr className="border-text-placeholder opacity-50 " />
        <PriorityFeeSetting />
        <hr className="border-text-placeholder opacity-50 pb-2" />
        <Link to="/history">
          <TextButton>Tx History &#10132;</TextButton>
        </Link>
      </div>
    );
  return (
    <Menu as="div" className="relative inline-block ">
      <div>
        <Menu.Button className="hover:opacity-75 active:opacity-50 pr-0 ">
          <div className="h-8 w-8 border-[1px] border-text rounded-lg flex items-center justify-center  bg-background-container">
            <GearIcon className="text-text" height={24} width={24} />
          </div>
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div className="absolute right-1 z-[3] bg-background-panelSurface border-text-placeholder border rounded-lg space-y-2  outline-none">
          <div className="bg-background-panel rounded-lg">
            <div className="bg-background-input rounded-lg space-y-2 px-2">
              <SettingMenuItem
                onClick={() => {
                  setSettingsOpen(true);
                }}
              >
                Settings
              </SettingMenuItem>
              <SettingMenuItem
                onClick={() => {
                  setDebridgeOpen(true);
                }}
              >
                Bridge
              </SettingMenuItem>
              <SettingMenuItem>
                <ToolTip
                  content={<p className="min-w-[120px]">Coming soon...</p>}
                >
                  Portfolio
                </ToolTip>
              </SettingMenuItem>
            </div>
          </div>
        </div>
      </Transition>
      <Debridge isOpen={debridgeOpen} onClose={() => setDebridgeOpen(false)} />
      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </Menu>
  );
};

export const SettingsDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [network, setNetwork, customRpc, setCustomRpc] = useDevnetState();
  const [annualized, setAnnualized] = useRecoilState(annualizeRatesAtom);
  const [customVal, setCustomVal] = useState(customRpc);
  const [explorer, setExplorer] = useRecoilState(explorerAtom);

  const onSaveCustomRpc = useCallback(async () => {
    if (customVal) {
      if (customVal.startsWith("http://") || customVal.startsWith("https://")) {
        setCustomRpc(customVal);
      } else {
        setCustomRpc("https://" + customVal);
      }
    }
  }, [customVal, setCustomRpc]);
  return (
    <SimpleModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-background-panel min-w-[370px] p-3 rounded-lg space-y-2">
        <div className="pb-2">
          <p className="font-semibold mb-2">Network</p>
          <div>
            <Toggle onChange={(i) => setNetwork(i)} selectedIndex={network}>
              <div className="font-medium">Mainnet</div>
              <div className="font-medium">Devnet</div>
              <div className="font-medium">Custom</div>
            </Toggle>
          </div>
          {network === NetworkOption.Custom && (
            <div className="flex flex-row text-xs mt-4">
              <TextInput
                containerClassName="flex-1"
                aria-multiline={true}
                value={customVal}
                onChange={setCustomVal}
              />
              <Button className="ml-2" onClick={onSaveCustomRpc}>
                Save
              </Button>
            </div>
          )}
        </div>
        <hr className="border-text-placeholder opacity-50 " />
        <PriorityFeeSetting />
        <hr className="border-text-placeholder opacity-50 " />
        <div className="w-full">
          <p className="font-semibold">Explorer</p>
          <Listbox value={explorer} onChange={setExplorer}>
            <Listbox.Button
              className={`border border-text-placeholder hover:bg-background-panelSurface w-full text-left pl-2`}
            >
              <span>{Explorers[explorer].name}</span>
            </Listbox.Button>
            <Listbox.Options>
              {Object.values(Explorers).map(({ name }, i) => (
                <Listbox.Option
                  key={name}
                  value={i}
                  className={` hover:bg-background-container w-full text-left rounded-md p-2 cursor-pointer ${
                    explorer === i ? " text-primary font-semibold" : ""
                  } `}
                >
                  {name}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Listbox>
        </div>
        <hr className="border-text-placeholder opacity-50 pb-2" />
        <Checkbox
          onChange={setAnnualized}
          value={annualized}
          label="Annualize Rates"
        />
        <hr className="border-text-placeholder opacity-50 py-2" />
        <Link to="/history">
          <TextButton className="font-semibold">Tx History &#10132;</TextButton>
        </Link>
        <GitHash />
      </div>
    </SimpleModal>
  );
};

export const SettingMenuItem = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <div
      className="cursor-pointer hover:bg-background-panel rounded-md items-center align-middle p-2"
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const PriorityFeeSetting = () => {
  const [priorityFee, setPriorityFee] = useRecoilState(customPriorityFee);
  const selected = useMemo(() => {
    if (!priorityFee) return 0;
    if (priorityFee === "10000") return 1;
    if (priorityFee === "16000") return 2;
    return 3;
  }, [priorityFee]);
  return (
    <div className="w-full">
      <p className="font-semibold mb-2">Priority Fee</p>
      <Toggle
        onChange={(i) => {
          if (!i) setPriorityFee("");
          if (i === 1) setPriorityFee("10000");
          if (i === 2) setPriorityFee("16000");
          if (i === 3) setPriorityFee("7000");
        }}
        selectedIndex={selected}
      >
        <div className="font-medium">Default</div>
        <div className="font-medium">Fast</div>
        <div className="font-medium">Turbo</div>
        <div className="font-medium">Custom</div>
      </Toggle>

      {!["", "10000", "16000"].includes(priorityFee) && (
        <div className="flex flex-col space-y-1 my-2">
          <span>Microlamports</span>
          <NumberInput
            value={priorityFee}
            onChange={(v) => {
              if (v) {
                setPriorityFee(v);
              } else setPriorityFee("0");
            }}
          />
        </div>
      )}
    </div>
  );
};
