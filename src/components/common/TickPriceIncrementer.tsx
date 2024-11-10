import { useMemo } from "react"
import { useStepIncrement } from "../../hooks/Whirlpool/useStepIncrement"
import { Button } from "../Button"

export const TickPriceIncrementer = ({
    setValue,
    value,
    whirlpoolKey,
    range
}: {
    setValue: (arg0: string) => void,
    value: string,
    whirlpoolKey: string
    range?: { min: string, max: string }
}) => {
    const increment = useStepIncrement(whirlpoolKey)
    const plusOutOfRange = useMemo(() => range && increment(value, true).gte(range.max || Infinity.toString()), [increment, range, value])
    const minusOutOfRange = useMemo(() => range && increment(value, false).lte(range.min || 0), [increment, range, value])
    return (<div className="flex flex-row mx-1 space-x-1">
        <Button
            disabled={minusOutOfRange}
            className="h-6 w-6" variant="outline" onClick={() => {
                const newVal = increment(value, false);
                setValue(newVal.toString());
            }}>-</Button>
        <Button
            disabled={plusOutOfRange}
            className="h-6 w-6" variant="outline" onClick={() => {
                const newVal = increment(value, true);
                setValue(newVal.toString());
            }}>+</Button>
    </div>)
}