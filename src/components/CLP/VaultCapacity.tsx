import { usdFormatter } from "../../utils/constants"
import { InfoTooltip } from "../common/InfoTooltip"
import { CircularProgress } from "../common/ReloadSpinner"

export const VaultCapacity = ({ deposited, capacity }: {
    deposited: number,
    capacity: number
}) => {
    return (
        <InfoTooltip tooltipContent={<p className="font-khand font-semibold text-xl">
            {usdFormatter.format(deposited)} <span className=" text-text-placeholder">/{usdFormatter.format(capacity)}</span>
        </p>}>
            <CircularProgress percentage={100 * deposited / capacity} radius={28} showPercentage />
        </InfoTooltip>
    )
}