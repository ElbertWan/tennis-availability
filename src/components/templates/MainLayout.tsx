import { Box, IconButton, Tooltip } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import type { ReactNode } from "react";
import { DRAWER_WIDTH } from "@/constants";

interface MainLayoutProps {
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  header: ReactNode;
  children: ReactNode;
  drawer: ReactNode;
}

export function MainLayout({
  drawerOpen,
  onToggleDrawer,
  header,
  children,
  drawer,
}: MainLayoutProps) {
  return (
    <Box
      className="app"
      sx={{
        mr: { xs: 0, md: drawerOpen ? `${DRAWER_WIDTH}px` : 0 },
        transition: "margin-right 225ms cubic-bezier(0, 0, 0.2, 1)",
      }}
    >
      {header}
      <main className="venue-list">{children}</main>
      {drawer}

      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Tooltip title={drawerOpen ? "Close search" : "Find available"} placement="left">
          <IconButton
            onClick={onToggleDrawer}
            sx={{
              position: "fixed",
              right: drawerOpen ? DRAWER_WIDTH : 0,
              top: "50%",
              transform: "translateY(-50%)",
              transition: "right 225ms cubic-bezier(0, 0, 0.2, 1)",
              zIndex: 1201,
              width: 28,
              height: 48,
              borderRadius: "8px 0 0 8px",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": {
                bgcolor: "primary.dark",
              },
              boxShadow: 2,
            }}
          >
            {drawerOpen ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
