"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { SprintWithStats } from "@/types/sprint";
import { format } from "date-fns";
import { DatePicker } from "./date-picker";

interface EditSprintDialogProps {
  sprint: SprintWithStats;
  onSuccess?: () => void;
}

export function EditSprintDialog({ sprint, onSuccess }: EditSprintDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("Dashboard.sprints");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: sprint.name,
    goal: sprint.goal || "",
    status: sprint.status,
    startDate: format(new Date(sprint.startDate), "yyyy-MM-dd"),
    endDate: format(new Date(sprint.endDate), "yyyy-MM-dd"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `/api/projects/${sprint.projectId}/sprints/${sprint.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to update sprint");
      }

      toast({
        title: t("updateSuccess"),
        description: `Sprint "${formData.name}" has been updated.`,
      });

      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error("Error updating sprint:", error);
      toast({
        title: t("updateError"),
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("edit")}</DialogTitle>
            <DialogDescription>
              Update sprint details and status
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                placeholder={t("namePlaceholder")}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal">{t("goal")}</Label>
              <Textarea
                id="goal"
                placeholder={t("goalPlaceholder")}
                value={formData.goal}
                onChange={(e) =>
                  setFormData({ ...formData, goal: e.target.value })
                }
                maxLength={500}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">{t("status")}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as "PLANNING" | "ACTIVE" | "COMPLETED" | "CANCELLED" })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">
                    {t("statuses.PLANNING")}
                  </SelectItem>
                  <SelectItem value="ACTIVE">{t("statuses.ACTIVE")}</SelectItem>
                  <SelectItem value="COMPLETED">
                    {t("statuses.COMPLETED")}
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    {t("statuses.CANCELLED")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">{t("startDate")}</Label>
                <DatePicker
                  value={formData.startDate}
                  onChange={(date) =>
                    setFormData({ ...formData, startDate: date })
                  }
                  placeholder={t("selectStartDate") || "Pick start date"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">{t("endDate")}</Label>
                <DatePicker
                  value={formData.endDate}
                  onChange={(date) =>
                    setFormData({ ...formData, endDate: date })
                  }
                  placeholder={t("selectEndDate") || "Pick end date"}
                  minDate={formData.startDate}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("updating") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
