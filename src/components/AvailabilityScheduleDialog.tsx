import { useState, useEffect } from "react";
import { toast } from "sonner";
import { playerApi } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, Loader2, CheckCircle2 } from "lucide-react";

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────
const DAYS = [
  { key: "monday",    label: "Mon" },
  { key: "tuesday",   label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday",  label: "Thu" },
  { key: "friday",    label: "Fri" },
  { key: "saturday",  label: "Sat" },
  { key: "sunday",    label: "Sun" },
] as const;

const SLOTS = [
  { key: "morning",   label: "Morning",   sub: "6 am – 12 pm" },
  { key: "afternoon", label: "Afternoon", sub: "12 pm – 5 pm" },
  { key: "evening",   label: "Evening",   sub: "5 pm – 10 pm" },
] as const;

type Day  = typeof DAYS[number]["key"];
type Slot = typeof SLOTS[number]["key"];
type Schedule = Record<Day, Slot[]>;

const EMPTY_SCHEDULE: Schedule = {
  monday: [], tuesday: [], wednesday: [], thursday: [],
  friday: [], saturday: [], sunday: [],
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function countActiveSlots(schedule: Schedule): number {
  return Object.values(schedule).reduce((sum, slots) => sum + slots.length, 0);
}

function activeDayLabels(schedule: Schedule): string {
  const active = DAYS.filter(d => schedule[d.key].length > 0).map(d => d.label);
  if (active.length === 0) return "No days selected";
  if (active.length === 7) return "Every day";
  return active.join(", ");
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────
interface Props {
  /** Current schedule from the user object (can be null/undefined). */
  initialSchedule?: Record<string, string[]> | null;
  /** Fired after a successful save with the updated schedule and is_available flag. */
  onSaved?: (schedule: Record<string, string[]>, isAvailable: boolean) => void;
  /** Custom trigger element; defaults to the "Update Availability" button. */
  trigger?: React.ReactNode;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export default function AvailabilityScheduleDialog({ initialSchedule, onSaved, trigger }: Props) {
  const [open, setOpen]         = useState(false);
  const [schedule, setSchedule] = useState<Schedule>(EMPTY_SCHEDULE);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(false);

  // ── Load from server whenever dialog opens ──
  useEffect(() => {
    if (!open) return;
    if (initialSchedule) {
      // Merge provided schedule into the full-week structure
      const merged: Schedule = { ...EMPTY_SCHEDULE };
      for (const [day, slots] of Object.entries(initialSchedule)) {
        if (day in merged) {
          merged[day as Day] = (slots as string[]).filter(
            (s): s is Slot => SLOTS.some(sl => sl.key === s)
          );
        }
      }
      setSchedule(merged);
      return;
    }
    // Fallback: fetch from API
    setLoading(true);
    playerApi.getWeeklyAvailability()
      .then(({ schedule: remote }) => {
        const merged: Schedule = { ...EMPTY_SCHEDULE };
        for (const [day, slots] of Object.entries(remote)) {
          if (day in merged) {
            merged[day as Day] = (slots as string[]).filter(
              (s): s is Slot => SLOTS.some(sl => sl.key === s)
            );
          }
        }
        setSchedule(merged);
      })
      .catch(() => { /* silently keep empty */ })
      .finally(() => setLoading(false));
  }, [open, initialSchedule]);

  // ── Toggle a single cell ──
  const toggleSlot = (day: Day, slot: Slot) => {
    setSchedule(prev => {
      const daySlots = prev[day];
      const next = daySlots.includes(slot)
        ? daySlots.filter(s => s !== slot)
        : [...daySlots, slot];
      return { ...prev, [day]: next };
    });
  };

  // ── Select / deselect an entire day ──
  const toggleDay = (day: Day) => {
    setSchedule(prev => {
      const allSelected = SLOTS.every(sl => prev[day].includes(sl.key));
      return { ...prev, [day]: allSelected ? [] : SLOTS.map(sl => sl.key) };
    });
  };

  // ── Select / deselect a whole slot column ──
  const toggleSlotColumn = (slot: Slot) => {
    setSchedule(prev => {
      const allSelected = DAYS.every(d => prev[d.key].includes(slot));
      const next = { ...prev };
      for (const d of DAYS) {
        if (allSelected) {
          next[d.key] = next[d.key].filter(s => s !== slot);
        } else if (!next[d.key].includes(slot)) {
          next[d.key] = [...next[d.key], slot];
        }
      }
      return next;
    });
  };

  // ── Save ──
  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send days that are explicitly present (backend ignores empty days fine too)
      const result = await playerApi.setWeeklyAvailability(schedule as Record<string, string[]>);
      toast.success("Availability saved!");
      onSaved?.(result.schedule, result.is_available);
      setOpen(false);
    } catch {
      toast.error("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = countActiveSlots(schedule);
  const dayLabels   = activeDayLabels(schedule);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="secondary" className="w-full justify-start">
            <Calendar className="w-4 h-4 mr-2" />
            Update Availability
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Weekly Availability
          </DialogTitle>
          <DialogDescription>
            Select the days and time slots when you are typically available to play.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading your schedule…
          </div>
        ) : (
          <>
            {/* ── Grid ── */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {/* empty corner */}
                    <th className="w-16" />
                    {SLOTS.map(slot => (
                      <th key={slot.key} className="text-center pb-2">
                        <button
                          onClick={() => toggleSlotColumn(slot.key)}
                          className="group flex flex-col items-center gap-0.5 mx-auto hover:opacity-80"
                        >
                          <span className="font-semibold group-hover:text-primary transition-colors">
                            {slot.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{slot.sub}</span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {DAYS.map(day => {
                    const allSelected = SLOTS.every(sl => schedule[day.key].includes(sl.key));
                    return (
                      <tr key={day.key} className="border-t border-border/40">
                        {/* Day label / toggle all */}
                        <td className="py-2 pr-2">
                          <button
                            onClick={() => toggleDay(day.key)}
                            className={cn(
                              "font-medium text-sm w-full text-left px-1 rounded hover:opacity-80 transition-opacity",
                              allSelected ? "text-primary" : "text-foreground"
                            )}
                          >
                            {day.label}
                          </button>
                        </td>
                        {SLOTS.map(slot => {
                          const active = schedule[day.key].includes(slot.key);
                          return (
                            <td key={slot.key} className="py-2 text-center">
                              <button
                                onClick={() => toggleSlot(day.key, slot.key)}
                                aria-label={`${day.label} ${slot.label}`}
                                aria-pressed={active}
                                className={cn(
                                  "w-9 h-9 rounded-md border-2 transition-all duration-150 flex items-center justify-center mx-auto",
                                  active
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "bg-background border-border hover:border-primary/50"
                                )}
                              >
                                {active && <CheckCircle2 className="w-4 h-4" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Summary ── */}
            <div className="bg-muted/40 rounded-lg px-4 py-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active slots</span>
                <Badge variant={activeCount > 0 ? "default" : "secondary"}>
                  {activeCount} slot{activeCount !== 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Days</span>
                <span className="font-medium">{dayLabels}</span>
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
