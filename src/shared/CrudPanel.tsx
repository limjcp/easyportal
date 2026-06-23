import type { ReactNode } from "react";

import { cn } from "../utils/cn";

import { usePageContentBusy } from "./usePageContentBusy";



type CrudPanelProps = {

  children: ReactNode;

  className?: string;

  loading?: boolean;

};



/** Layout wrapper for CRUD pages. Pass loading to show the page-level busy overlay during fetch. */

export function CrudPanel({ children, className, loading = false }: CrudPanelProps) {

  usePageContentBusy(loading);

  return <div className={cn("relative space-y-4", className)}>{children}</div>;

}

