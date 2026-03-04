import type { SlotInfo } from "@/types";
import { STATUS_CLASS_MAP } from "@/constants";

interface StatusCellProps {
  info: SlotInfo;
}

export function StatusCell({ info }: StatusCellProps) {
  return (
    <td
      className={`grid-cell ${STATUS_CLASS_MAP[info.status]}`}
      style={info.colour ? { backgroundColor: info.colour } : undefined}
      title={info.label}
    >
      <span className="cell-text">{info.label}</span>
    </td>
  );
}
