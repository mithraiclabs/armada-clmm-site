export const ProgressBar = ({ percent }: { percent: number }) => {
  const width = Math.max(Math.min(percent, 100), 0);
  return (
    <div className="w-full bg-background-input rounded-full h-2.5">
      <div
        className="bg-primary h-2.5 rounded-full"
        style={{ width: `${width}%` }}
      />
    </div>
  );
};
