import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { DRAWER_WIDTH } from "@/constants";

interface MainLayoutProps {
  drawerOpen: boolean;
  header: ReactNode;
  children: ReactNode;
  drawer: ReactNode;
}

export function MainLayout({
  drawerOpen,
  header,
  children,
  drawer,
}: MainLayoutProps) {
  return (
    <Box
      className="app"
      sx={{
        mr: drawerOpen ? `${DRAWER_WIDTH}px` : 0,
        transition: "margin-right 225ms cubic-bezier(0, 0, 0.2, 1)",
      }}
    >
      {header}
      <main className="venue-list">{children}</main>
      {drawer}
    </Box>
  );
}
