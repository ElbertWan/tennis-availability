import {
  Box,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
} from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import dayjs from "dayjs";
import type { SearchResult } from "@/types";
import { getBookingUrl } from "@/utils/venue";

interface SearchResultGroupProps {
  dateStr: string;
  date: Date;
  items: SearchResult[];
}

export function SearchResultGroup({ dateStr, date, items }: SearchResultGroupProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{
          mb: 0.5,
          position: "sticky",
          top: 0,
          bgcolor: "background.paper",
          py: 0.5,
          zIndex: 1,
        }}
      >
        {dayjs(date).format("ddd, D MMM YYYY")}
      </Typography>
      <Table size="small">
        <TableBody>
          {items.map((r, i) => {
            const bookUrl = getBookingUrl(r.venue, dateStr);
            return (
              <TableRow key={i}>
                <TableCell sx={{ py: 0.75, pl: 0 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {r.venue.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.court}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  <Typography variant="body2">{r.timeLabel}</Typography>
                  {r.cost && (
                    <Typography variant="caption" color="text.secondary">
                      {r.cost}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ py: 0.75, pr: 0 }}>
                  <IconButton
                    size="small"
                    href={bookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
