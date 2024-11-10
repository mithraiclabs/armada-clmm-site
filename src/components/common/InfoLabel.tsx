export const InfoLabel = ({ title, value, highlighted }: { title: string, value: string, highlighted?: boolean }) => {
    return (
        <div className="flex flex-col mx-1">
            <p className="flex font-montserrat font-semibold text-text-placeholder text-md">{title}</p>
            <p className={`flex font-khand text-xl ${highlighted ? 'text-primary' : 'text-text'}`}>{value}</p>
        </div>
    )
} 