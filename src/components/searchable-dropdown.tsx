"use client";

import React, { useState } from "react";
import { ChevronDown, LucideIcon, Plus, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface SearchableDropdownItem {
  id: string;
  name: string;
  description?: string;
  image?: string;
  icon?: LucideIcon;
  badge?: string;
}

interface SearchableDropdownProps {
  items: SearchableDropdownItem[];
  selectedItem: SearchableDropdownItem | null;
  onSelect: (item: SearchableDropdownItem) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  triggerClassName?: string;
  showIcon?: boolean;
  icon?: LucideIcon;
  isLoading?: boolean;
  disabled?: boolean;
  maxWidth?: string;
  itemsLabel?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
}

export function SearchableDropdown({
  items,
  selectedItem,
  onSelect,
  placeholder = "Select item",
  searchPlaceholder = "Search items...",
  emptyMessage = "No items found.",
  triggerClassName,
  showIcon = false,
  icon: Icon,
  isLoading = false,
  disabled = false,
  maxWidth = "w-[280px]",
  itemsLabel = "Items",
  onAddNew,
  addNewLabel = "Add New",
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Filter items based on search
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Determine if list should be scrollable (more than 5 items)
  const isScrollable = filteredItems.length > 5;

  const getFirstLetter = (name: string) => name.charAt(0).toUpperCase();

  const handleSelect = (itemId: string) => {
    const selectedItem = items.find((item) => item.id === itemId);
    if (selectedItem) {
      onSelect(selectedItem);
      setOpen(false);
      setSearchValue("");
    }
  };

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew();
      setOpen(false);
      setSearchValue("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled || isLoading}
          className={cn(
            "h-auto py-1 px-2 hover:bg-accent gap-2",
            selectedItem && "font-medium",
            triggerClassName
          )}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground border-t-transparent"></div>
              <span className="text-sm text-muted-foreground">Loading...</span>
            </>
          ) : selectedItem ? (
            <>
              {showIcon && Icon ? (
                <Icon className="h-4 w-4" />
              ) : null}
              {selectedItem.image ? (
                <Avatar className="h-5 w-5 rounded-md">
                  <AvatarImage
                    src={selectedItem.image}
                    alt={selectedItem.name}
                  />
                  <AvatarFallback className="text-xs rounded-md bg-muted">
                    {getFirstLetter(selectedItem.name)}
                  </AvatarFallback>
                </Avatar>
              ) : null}
              <span className="max-w-[150px] truncate">{selectedItem.name}</span>
              {selectedItem.badge && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {selectedItem.badge}
                </span>
              )}
            </>
          ) : (
            <>
              {showIcon && Icon ? (
                <Icon className="h-4 w-4" />
              ) : null}
              <span className="text-sm">{placeholder}</span>
            </>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className={cn("p-0", maxWidth)}>
        <div className="flex flex-col">
          {/* 1. Search Box */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder={searchPlaceholder}
              className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              autoFocus
            />
          </div>
          
          {/* 2. Scrollable List */}
          <div className={cn(
            "overflow-hidden",
            isScrollable && "max-h-[240px] overflow-y-auto"
          )}>
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <div className="p-1">
                {itemsLabel && (
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {itemsLabel}
                  </div>
                )}
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground",
                      selectedItem?.id === item.id && "bg-accent text-accent-foreground"
                    )}
                  >
                    {/* Check indicator */}
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {selectedItem?.id === item.id && (
                        <Check className="h-4 w-4" />
                      )}
                    </span>

                    {/* Item content */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.image ? (
                        <Avatar className="h-6 w-6 rounded-md shrink-0">
                          <AvatarImage src={item.image} alt={item.name} />
                          <AvatarFallback className="text-xs rounded-md bg-muted">
                            {getFirstLetter(item.name)}
                          </AvatarFallback>
                        </Avatar>
                      ) : item.icon ? (
                        <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </div>
                        )}
                      </div>
                      {item.badge && (
                        <span className="ml-auto text-xs text-muted-foreground shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Add Item Button */}
          {onAddNew && (
            <>
              <div className="-mx-1 my-1 h-px bg-muted" />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={handleAddNew}
                >
                  <Plus className="h-4 w-4" />
                  <span>{addNewLabel}</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
