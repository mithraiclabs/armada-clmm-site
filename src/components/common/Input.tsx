import {
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { formatNumber, parseNumber } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { InfoTooltip } from ".";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import { useTokens } from "../../hooks/useTokens";
import { Token } from "@mithraic-labs/psy-token-registry";

interface InputProps
  extends Omit<HTMLAttributes<HTMLInputElement>, "onChange"> {
  containerClassName?: string;
  value: string;
  onChange: (value: string) => void;
  startIcon?: React.ReactNode;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  hideMax?: boolean;
  decimals?: number;
  required?: boolean;
  startIconClassName?: string;
}

export const NumberInput: React.FC<InputProps> = ({
  containerClassName,
  className,
  value,
  onChange,
  startIcon,
  max,
  disabled,
  hideMax,
  required,
  decimals,
  ...props
}) => {
  const { t } = useTranslation();
  const inputValue = useMemo(
    () => (value === "" ? "" : formatNumber(value)),
    [value]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleanValue = e.target.value.replace(/,/g, ""); // Remove commas for processing
      if (!isValidNumber(cleanValue, decimals)) {
        return;
      }
      onChange(cleanValue);
    },
    [decimals, onChange]
  );

  const handleBlur = () => {
    if (!value) {
      return;
    }
    const numValue = parseNumber(value);
    let finalValue = numValue;
    if (max && !isNaN(max) && numValue > max) {
      finalValue = max;
    }
    const formattedValue = isNaN(finalValue) ? "" : finalValue.toString();
    onChange(formattedValue); // Return the value without formatting
  };

  return (
    <div
      className={`flex items-center relative ${
        required ? " border-text-danger border rounded-xl" : ""
      } ${containerClassName ?? ""}`}
    >
      {startIcon && <div className="absolute ml-[12px]">{startIcon}</div>}
      <input
        type="text" // Changed to text to handle formatted input
        className={`flex-1 bg-background-input outline-none px-3 ${
          startIcon ? "pl-9" : ""
        } font-medium py-2.5 rounded-xl border-text-placeholder border placeholder-text-placeholder ${
          className ?? ""
        }`}
        onChange={handleChange}
        disabled={disabled}
        value={inputValue}
        onBlur={handleBlur}
        {...props}
      />
      {!!max && !hideMax && (
        <button
          className="absolute right-1 text-primary font-semibold"
          onClick={() => onChange(String(max))}
        >
          {t("Max")}
        </button>
      )}
    </div>
  );
};

const isValidNumber = (value: string, decimals?: number): boolean => {
  const regex = new RegExp(`^\\d*(\\.\\d{0,${decimals ?? ""}})?$`);
  return regex.test(value);
};

export const TextInput = ({
  containerClassName,
  value,
  onChange,
  startIcon,
  disabled,
  startIconClassName,
  required,
  ...props
}: InputProps) => {
  return (
    <div
      className={`flex items-center relative ${
        required ? " border-text-danger border rounded-xl" : ""
      } ${containerClassName ?? ""}`}
    >
      {startIcon ? <div className="absolute ml-[12px]">{startIcon}</div> : null}
      <input
        type="text"
        className={`flex-1 bg-background-input outline-none px-3 ${
          startIcon ? startIconClassName ?? " pl-9" : ""
        } font-medium py-2.5 rounded-xl border-text-placeholder border placeholder-text-placeholder ${
          props.color ? "text-" + props.color : ""
        }  `}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        disabled={disabled}
        value={value}
        {...props}
      />
    </div>
  );
};

/**
 * @deprecated
 * to be deleted in favor of DateTimePicker
 */
export const DateInput = ({
  containerClassName,
  value,
  onChange,
  startIcon,
  disabled,
  startIconClassName,
  ...props
}: InputProps) => {
  return (
    <div className={`flex items-center relative ${containerClassName ?? ""}`}>
      {startIcon ? <div className="absolute ml-[12px]">{startIcon}</div> : null}
      <input
        type="datetime-local"
        className={`flex-1 bg-background-input outline-none px-3 ${
          startIcon ? startIconClassName ?? "pl-9" : ""
        } font-medium py-2.5 rounded-xl border-text-placeholder border placeholder-text-placeholder`}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        disabled={disabled}
        value={value}
        {...props}
      />
    </div>
  );
};

export const MintInputWithDropdown = ({
  containerClassName,
  value,
  onChange,
  disabled,
  ...props
}: InputProps) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const tokens = useTokens();
  const options = useMemo(() => Object.entries(tokens), [tokens]);

  const [filteredOptions, setFilteredOptions] =
    useState<[mint: string, token?: Token][]>(options);

  useEffect(() => {
    setFilteredOptions(
      options.filter(([mint]) =>
        mint.toLowerCase().includes(value.toLowerCase())
      )
    );
  }, [value, options]);

  return (
    <div
      className={`flex flex-col items-center relative ${
        containerClassName ?? ""
      }`}
    >
      <TextInput
        containerClassName="w-full"
        {...props}
        onChange={onChange}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        disabled={disabled}
        value={value}
        startIconClassName="pl-16"
        startIcon={
          tokens[value] ? (
            <span className="text-sm text-center">{tokens[value].symbol}</span>
          ) : null
        }
      />

      {showDropdown && (
        <ul className="absolute top-full mt-1 max-h-60 w-full overflow-auto rounded-md shadow-lg z-30">
          {filteredOptions.map(([mint, token]) => (
            <li
              key={mint}
              className="px-4 py-2 text-xs hover:bg-background-container bg-background-panelSurface cursor-pointer font-semibold"
              onClick={() => {
                onChange(mint);
                setShowDropdown(false);
              }}
            >
              <div className="flex flex-row justify-between">
                {mint.substring(0, 20)}...
                <span>{token?.symbol}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const NumberInputWithInfoTooltip = ({
  value,
  onChange,
  fieldName,
  description,
  disabled,
  fullWidth,
  required,
}: {
  fieldName: string;
  value: string;
  onChange: (val: string) => void;
  description?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  required?: boolean;
}) => {
  return (
    <div className={fullWidth ? "w-full" : "w-fit"}>
      <div
        className={`my-1 font-semibold text-text-placeholder 
                        flex flex-row items-center space-x-1
                        `}
      >
        <p>{fieldName}</p>
        {description && (
          <InfoTooltip tooltipContent={<p>{description}</p>}>
            <InformationCircleIcon className="w-4 h-4" />
          </InfoTooltip>
        )}
      </div>
      <NumberInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
      />
    </div>
  );
};

export const TextInputWithInfoTooltip = ({
  value,
  onChange,
  fieldName,
  description,
  disabled,
  fullWidth,
  required,
}: {
  fieldName: string;
  value: string;
  onChange: (val: string) => void;
  description?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  required?: boolean;
}) => {
  return (
    <div className={fullWidth ? "w-full" : "w-fit"}>
      <div
        className={`my-1 font-semibold text-text-placeholder 
                        flex flex-row items-center space-x-1
                        `}
      >
        <p>{fieldName}</p>
        {description && (
          <InfoTooltip tooltipContent={<p>{description}</p>}>
            <InformationCircleIcon className="w-4 h-4" />
          </InfoTooltip>
        )}
      </div>
      <TextInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
      />
    </div>
  );
};
