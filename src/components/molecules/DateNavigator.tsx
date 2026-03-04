import { Stack } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { DateNavButton } from "@/components/atoms/DateNavButton";
import { shiftDate } from "@/utils/time";

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigator({ selectedDate, onDateChange }: DateNavigatorProps) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <DateNavButton
        direction="prev"
        onClick={() => onDateChange(shiftDate(selectedDate, -1))}
      />
      <DatePicker
        value={dayjs(selectedDate)}
        onChange={(v) => {
          if (v) onDateChange(v.toDate());
        }}
        slotProps={{
          textField: {
            size: "small",
            sx: {
              width: 160,
              "& .MuiOutlinedInput-root": { fontSize: "0.85rem" },
            },
          },
        }}
      />
      <DateNavButton
        direction="next"
        onClick={() => onDateChange(shiftDate(selectedDate, 1))}
      />
    </Stack>
  );
}
