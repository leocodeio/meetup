"use client";

import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SprintDateRangeProps {
  startDate: Date;
  endDate: Date;
  isCompleted: boolean;
}

export function SprintDateRange({
  startDate,
  endDate,
  isCompleted,
}: SprintDateRangeProps) {
  const today = new Date();
  const daysLeft = differenceInDays(endDate, today);
  const isOverdue = daysLeft < 0;

  return (
    <div className="flex items-center gap-4 mt-3 text-sm">
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors text-muted-foreground hover:text-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>
              {format(new Date(startDate), "MMM d, yyyy")} -{" "}
              {format(endDate, "MMM d, yyyy")}
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="space-y-4 p-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Start Date
              </p>
              <Calendar
                mode="single"
                selected={new Date(startDate)}
                disabled
                className="rounded-md border"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                End Date
              </p>
              <Calendar
                mode="single"
                selected={endDate}
                disabled
                className="rounded-md border"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {!isCompleted && (
        <Badge
          variant={isOverdue ? "destructive" : "secondary"}
          className="text-xs"
        >
          {isOverdue
            ? `${Math.abs(daysLeft)} days overdue`
            : `${daysLeft} days left`}
        </Badge>
      )}
    </div>
  );
}
