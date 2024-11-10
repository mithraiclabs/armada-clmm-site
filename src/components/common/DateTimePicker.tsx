import { Datepicker } from "@aliakbarazizi/headless-datepicker";

export const DateTimePicker = ({
  onChange,
  value,
  fullWidth,
}: {
  onChange: (v: string) => void;
  value: string | null;
  fullWidth?: boolean;
}) => {
  const dateValue = value ? new Date(parseInt(value) * 1000) : null;

  const handleChange = (date: Date | null) => {
    const newValue = date ? Math.floor(date.getTime() / 1000).toString() : "";
    onChange(newValue);
  };
  return (
    <Datepicker onChange={handleChange} value={dateValue}>
      <Datepicker.Input
        format="MMM dd, yyyy HH:mm:ss"
        className={`flex-1 bg-background-input border border-text-placeholder px-3 font-medium py-2.5 rounded-xl ${
          !fullWidth && "w-fit"
        }
         placeholder-text-placeholder outline-none focus-within:ring-1 focus-within:ring-primary
         `}
        style={
          fullWidth
            ? {
                minWidth: "100%",
              }
            : undefined
        }
      />
      <Datepicker.Picker
        defaultType="day"
        className={`rounded-lg z-10 p-4 shadow-md border-background-container border-2
        bg-background-input `}
      >
        {({ monthName, hour, minute, year }) => (
          <>
            <div className="flex w-full items-center justify-between space-x-6 py-2 rtl:space-x-reverse">
              <Datepicker.Button
                action="prev"
                className="rounded-xl p-2 text-sm font-medium hover:bg-background-container rtl:rotate-180"
              >
                &larr;
              </Datepicker.Button>
              <div className="flex">
                <Datepicker.Button
                  action="toggleHourPicker"
                  className="leading-2 p-2 text-lg font-semibold hover:bg-background-container flex items-center w-16 space-x-2"
                >
                  {("0" + hour).slice(-2) + ":" + ("0" + minute).slice(-2)}
                </Datepicker.Button>
                <Datepicker.Button
                  action="toggleMonth"
                  className="leading-2 p-2 text-lg font-semibold hover:bg-background-container w-32"
                >
                  {monthName}
                </Datepicker.Button>
                <Datepicker.Button
                  action="toggleYear"
                  className="leading-2 p-2 text-lg font-semibold hover:bg-background-container w-16"
                >
                  {year}
                </Datepicker.Button>
              </div>
              <Datepicker.Button
                action="next"
                className="rounded-xl p-2 text-sm font-medium hover:bg-background-container rtl:rotate-180"
              >
                &rarr;
              </Datepicker.Button>
            </div>
            <Datepicker.Items
              className={({ type }) =>
                `grid w-full auto-rows-max gap-2 overflow-y-auto scroll-smooth 
                  ${type == "day" && "grid-cols-7 "}
                  ${type == "month" && "grid-cols-3 "}
                  ${type == "year" && "max-h-[274px] grid-cols-4 "}`
              }
            >
              {({ items }) =>
                items.map((item) => (
                  <Datepicker.Item
                    key={item.key}
                    item={item}
                    className={`
                      grid items-center justify-center rounded-xl py-1.5 text-sm font-medium select-none
                      ${
                        item.isHeader
                          ? "cursor-default "
                          : "hover:bg-background-container "
                      }
                    
                      ${item.type === "day" && "h-8 w-8 "}
                      ${
                        item.isSelected &&
                        "bg-primary text-text-button hover:text-white"
                      }
                      ${item.isToday && "border border-gray-500 "}`}
                    action={
                      item.type === "day"
                        ? "close"
                        : item.type === "month"
                        ? "showDay"
                        : "showMonth"
                    }
                  >
                    {item.isHeader ? item.text.substring(0, 2) : item.text}
                  </Datepicker.Item>
                ))
              }
            </Datepicker.Items>
            <Datepicker.Button
              action="todayHour"
              className="mt-4 w-full bg-primary p-2 text-sm font-semibold text-text-button"
            >
              Now
            </Datepicker.Button>
            <Datepicker.Picker
              className="flex max-h-56 rounded-md border border-gray-600  bg-background-panelSurface py-2 shadow-md rtl:flex-row-reverse "
              id="HourPicker"
            >
              <Datepicker.Items
                type="hour"
                className="overflow-y-auto scroll-smooth px-4 "
                disableAutoScroll
              >
                {({ items }) =>
                  items.map((item) => (
                    <Datepicker.Item
                      key={item.key}
                      item={item}
                      action="close"
                      className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-semibold hover:bg-background-container 
                        ${
                          item.isSelected &&
                          "bg-primary text-text-button hover:text-white"
                        }`}
                    >
                      {("0" + item.text).slice(-2)}
                    </Datepicker.Item>
                  ))
                }
              </Datepicker.Items>
              <Datepicker.Items
                type="minute"
                className="overflow-y-auto scroll-smooth px-4"
                disableAutoScroll
              >
                {({ items }) =>
                  items.map((item) => (
                    <Datepicker.Item
                      key={item.key}
                      item={item}
                      action="close"
                      className={`flex h-8 w-8 items-center justify-center rounded-xl font-semibold text-sm  hover:bg-background-container 
                        ${
                          item.isSelected &&
                          "bg-primary text-text-button hover:text-white"
                        }`}
                    >
                      {("0" + item.text).slice(-2)}
                    </Datepicker.Item>
                  ))
                }
              </Datepicker.Items>
            </Datepicker.Picker>
          </>
        )}
      </Datepicker.Picker>
    </Datepicker>
  );
};
