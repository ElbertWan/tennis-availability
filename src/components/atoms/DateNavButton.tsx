import { IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

interface DateNavButtonProps {
  direction: "prev" | "next";
  onClick: () => void;
}

export function DateNavButton({ direction, onClick }: DateNavButtonProps) {
  return (
    <IconButton
      size="small"
      onClick={onClick}
      title={direction === "prev" ? "Previous day" : "Next day"}
      sx={{ border: "1px solid", borderColor: "divider" }}
    >
      {direction === "prev" ? (
        <ChevronLeft fontSize="small" />
      ) : (
        <ChevronRight fontSize="small" />
      )}
    </IconButton>
  );
}
