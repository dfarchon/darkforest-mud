"use client";

import { cn } from "@frontend/Utils/Tabs-Utils";
import * as TabsPrimitive from "@radix-ui/react-tabs";

const Tabs = TabsPrimitive.Root;

const TabsList = ({ className, ...props }: TabsPrimitive.TabsListProps) => (
  <TabsPrimitive.List
    className={cn(
      "bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1",
      className,
    )}
    {...props}
  />
);

const TabsTrigger = ({
  className,
  ...props
}: TabsPrimitive.TabsTriggerProps) => (
  <TabsPrimitive.Trigger
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-background data-[state=active]:text-foreground",
      className,
    )}
    {...props}
  />
);

const TabsContent = ({
  className,
  ...props
}: TabsPrimitive.TabsContentProps) => (
  <TabsPrimitive.Content
    className={cn("mt-2 focus-visible:outline-none", className)}
    {...props}
  />
);

export { Tabs, TabsList, TabsTrigger, TabsContent };
