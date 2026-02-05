"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TIMEZONE_OPTIONS } from "@/lib/dateUtils";

interface TimezoneComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TimezoneCombobox({
  value,
  onChange,
  disabled = false,
  className,
}: TimezoneComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedTimezone = TIMEZONE_OPTIONS.find((tz) => tz.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select timezone"
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">
            {selectedTimezone?.label ?? "Select timezone..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command
          filter={(value, search) => {
            const timezone = TIMEZONE_OPTIONS.find((tz) => tz.value === value);
            if (!timezone) return 0;

            const searchLower = search.toLowerCase();
            const labelLower = timezone.label.toLowerCase();
            const valueLower = timezone.value.toLowerCase();

            // Match on label (includes UTC offset and city names)
            if (labelLower.includes(searchLower)) return 1;
            // Match on IANA timezone value
            if (valueLower.includes(searchLower)) return 1;
            // Match on UTC offset pattern (e.g., "-5", "+8", "utc-5")
            const offsetMatch = searchLower.match(/^(?:utc)?([+-]?\d{1,2})$/);
            if (offsetMatch) {
              const searchOffset = offsetMatch[1];
              const normalizedOffset = searchOffset.startsWith('+') || searchOffset.startsWith('-')
                ? searchOffset
                : `+${searchOffset}`;
              // Check if the label contains this offset
              if (labelLower.includes(`utc${normalizedOffset.replace('+', '+')}`) ||
                  labelLower.includes(`utc${normalizedOffset}`)) {
                return 1;
              }
            }
            return 0;
          }}
        >
          <CommandInput placeholder="Search timezone or UTC offset..." />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {TIMEZONE_OPTIONS.map((timezone) => (
                <CommandItem
                  key={timezone.value}
                  value={timezone.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === timezone.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{timezone.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
