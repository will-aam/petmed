import { addHours, parseISO, addDays, startOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export interface FixedTime {
  timeOfDay: string; // "HH:mm"
  orderIndex: number;
}

export interface TreatmentItemScheduleInput {
  id: string;
  treatmentItemId: string;
  petId: string;
  tutorProfileId: string;
  recurrenceType: "INTERVAL" | "FIXED_TIMES";
  intervalHours?: number | null;
  fixedTimes?: FixedTime[];
  startDate: Date;
  endDate?: Date | null;
  timezone: string;
}

export interface GeneratedDose {
  treatmentItemId: string;
  petId: string;
  tutorProfileId: string;
  scheduledFor: Date; // UTC
  status: "PENDING";
}

export function generateDoses(input: TreatmentItemScheduleInput): GeneratedDose[] {
  const doses: GeneratedDose[] = [];
  const start = input.startDate;
  const end = input.endDate ?? addDays(start, 30); // default 30 days if no end

  if (input.recurrenceType === "INTERVAL") {
    if (!input.intervalHours || input.intervalHours <= 0) {
      throw new Error("intervalHours is required for INTERVAL recurrence");
    }
    let current = start;
    while (current <= end) {
      doses.push({
        treatmentItemId: input.treatmentItemId,
        petId: input.petId,
        tutorProfileId: input.tutorProfileId,
        scheduledFor: current,
        status: "PENDING",
      });
      current = addHours(current, input.intervalHours);
    }
  } else if (input.recurrenceType === "FIXED_TIMES") {
    if (!input.fixedTimes || input.fixedTimes.length === 0) {
      throw new Error("fixedTimes are required for FIXED_TIMES recurrence");
    }
    const sorted = [...input.fixedTimes].sort((a, b) => a.orderIndex - b.orderIndex);
    let current = startOfDay(toZonedTime(start, input.timezone));
    const endZoned = toZonedTime(end, input.timezone);

    while (current <= endZoned) {
      for (const ft of sorted) {
        const [hours, minutes] = ft.timeOfDay.split(":").map(Number);
        const zonedDoseTime = new Date(current);
        zonedDoseTime.setHours(hours, minutes, 0, 0);
        const utcDoseTime = fromZonedTime(zonedDoseTime, input.timezone);
        if (utcDoseTime >= start && utcDoseTime <= end) {
          doses.push({
            treatmentItemId: input.treatmentItemId,
            petId: input.petId,
            tutorProfileId: input.tutorProfileId,
            scheduledFor: utcDoseTime,
            status: "PENDING",
          });
        }
      }
      current = addDays(current, 1);
    }
  }

  return doses;
}
