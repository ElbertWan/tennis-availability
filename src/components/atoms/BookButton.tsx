import { Button } from "@mui/material";
import { OpenInNew } from "@mui/icons-material";

interface BookButtonProps {
  href: string;
}

export function BookButton({ href }: BookButtonProps) {
  return (
    <Button
      size="small"
      variant="outlined"
      endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ fontSize: "0.75rem", ml: 1, py: 0.25, whiteSpace: "nowrap" }}
    >
      Book
    </Button>
  );
}
