"use client";

import { useEffect, useMemo, useState } from "react";

type RangeNote = {
  id: string;
  start: string;
  end: string;
  text: string;
};

type PersistedState = {
  monthlyNote: string;
  dayNotes: Record<string, string>;
  rangeNotes: RangeNote[];
};

type SlideDirection = "next" | "prev" | "none";

const STORAGE_KEY = "wall-calendar-v1";

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

const monthHeroImages: Record<number, { label: string; src: string }> = {
  0: { label: "january", src: "/images/jan.jpg" },
  1: { label: "february", src: "/images/feb.jpg" },
  2: { label: "march", src: "/images/march.jpg" },
  3: { label: "april", src: "/images/april.jpg" },
  4: { label: "may", src: "/images/may.jpg" },
  5: { label: "june", src: "/images/june.jpg" },
  6: { label: "july", src: "/images/july.jpg" },
  7: { label: "august", src: "/images/aug.jpg" },
  8: { label: "september", src: "/images/sept.jpg" },
  9: { label: "october", src: "/images/oct.jpg" },
  10: { label: "november", src: "/images/nov.jpg" },
  11: { label: "december", src: "/images/dec.jpg" },
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalISO(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromLocalISO(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

function getMonthLabel(date: Date) {
  return monthFormatter.format(date);
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getWeekdayLabels() {
  const start = new Date("2024-01-07T00:00:00");
  return Array.from({ length: 7 }).map((_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return weekdayFormatter.format(day);
  });
}

function buildMonthGrid(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = firstDay.getDay();
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - startOffset);

  return Array.from({ length: 42 }).map((_, index) => {
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + index);
    return cellDate;
  });
}

export default function WallCalendar() {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [monthlyNote, setMonthlyNote] = useState("");
  const [dayNotes, setDayNotes] = useState<Record<string, string>>({});
  const [rangeNotes, setRangeNotes] = useState<RangeNote[]>([]);
  const [draftDayNote, setDraftDayNote] = useState("");
  const [draftRangeNote, setDraftRangeNote] = useState("");
  const [slideDirection, setSlideDirection] = useState<SlideDirection>("none");
  const [heroImageError, setHeroImageError] = useState(false);

  const todayISO = toLocalISO(new Date());

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const saved = JSON.parse(raw) as PersistedState;
      setMonthlyNote(saved.monthlyNote ?? "");
      setDayNotes(saved.dayNotes ?? {});
      setRangeNotes(saved.rangeNotes ?? []);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const payload: PersistedState = { monthlyNote, dayNotes, rangeNotes };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [monthlyNote, dayNotes, rangeNotes]);

  const weekdayLabels = useMemo(() => getWeekdayLabels(), []);
  const monthGrid = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const heroForMonth = monthHeroImages[visibleMonth.getMonth()] ?? monthHeroImages[4];
  const heroKeyword = heroForMonth.label;
  const heroImageUrl = heroForMonth.src;

  useEffect(() => {
    setHeroImageError(false);
  }, [heroImageUrl]);

  useEffect(() => {
    if (slideDirection === "none") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSlideDirection("none");
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [slideDirection, visibleMonth]);

  const selectedDaysCount = useMemo(() => {
    if (!rangeStart) {
      return 0;
    }
    if (!rangeEnd) {
      return 1;
    }

    const start = fromLocalISO(rangeStart).getTime();
    const end = fromLocalISO(rangeEnd).getTime();
    const diff = Math.floor((end - start) / (24 * 60 * 60 * 1000));
    return diff + 1;
  }, [rangeStart, rangeEnd]);

  const monthDayNotesCount = useMemo(() => {
    const monthToken = `${visibleMonth.getFullYear()}-${pad(visibleMonth.getMonth() + 1)}`;
    return Object.keys(dayNotes).filter((key) => key.startsWith(monthToken)).length;
  }, [dayNotes, visibleMonth]);

  const monthRangeNotesCount = useMemo(() => {
    const monthStart = toLocalISO(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1));
    const monthEnd = toLocalISO(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0));

    return rangeNotes.filter((note) => note.end >= monthStart && note.start <= monthEnd).length;
  }, [rangeNotes, visibleMonth]);

  const spotlightNotes = useMemo(() => {
    const monthToken = `${visibleMonth.getFullYear()}-${pad(visibleMonth.getMonth() + 1)}`;

    return Object.entries(dayNotes)
      .filter(([date]) => date.startsWith(monthToken))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [dayNotes, visibleMonth]);

  function selectDate(dateISO: string) {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(dateISO);
      setRangeEnd(null);
      return;
    }

    if (dateISO < rangeStart) {
      setRangeStart(dateISO);
      return;
    }

    setRangeEnd(dateISO);
  }

  function onDateClick(dateISO: string) {
    selectDate(dateISO);
    setActiveDate(dateISO);
    setDraftDayNote(dayNotes[dateISO] ?? "");
  }

  function isWithinSelection(dateISO: string) {
    if (!rangeStart) {
      return false;
    }

    if (!rangeEnd) {
      return dateISO === rangeStart;
    }

    return dateISO >= rangeStart && dateISO <= rangeEnd;
  }

  function hasRangeNote(dateISO: string) {
    return rangeNotes.some((note) => dateISO >= note.start && dateISO <= note.end);
  }

  function saveDayNote() {
    if (!activeDate) {
      return;
    }

    const cleaned = draftDayNote.trim();
    setDayNotes((previous) => {
      if (!cleaned) {
        const clone = { ...previous };
        delete clone[activeDate];
        return clone;
      }
      return { ...previous, [activeDate]: cleaned };
    });
  }

  function deleteDayNote(dateISO: string) {
    setDayNotes((previous) => {
      if (!previous[dateISO]) {
        return previous;
      }

      const clone = { ...previous };
      delete clone[dateISO];
      return clone;
    });

    if (activeDate === dateISO) {
      setDraftDayNote("");
    }
  }

  function saveRangeNote() {
    const cleaned = draftRangeNote.trim();
    if (!rangeStart || !rangeEnd || !cleaned) {
      return;
    }

    const rangeNote: RangeNote = {
      id: `${rangeStart}_${rangeEnd}_${Date.now()}`,
      start: rangeStart,
      end: rangeEnd,
      text: cleaned,
    };

    setRangeNotes((previous) => [rangeNote, ...previous]);
    setDraftRangeNote("");
  }

  function deleteRangeNote(id: string) {
    setRangeNotes((previous) => previous.filter((note) => note.id !== id));
  }

  function clearSelection() {
    setRangeStart(null);
    setRangeEnd(null);
    setDraftRangeNote("");
  }

  function goToPreviousMonth() {
    setSlideDirection("prev");
    setVisibleMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setSlideDirection("next");
    setVisibleMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1));
  }

  function goToToday() {
    setSlideDirection("none");
    const now = new Date();
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  const monthSlideAnimation =
    slideDirection === "next"
      ? "calendarSlideFromRight 700ms cubic-bezier(0.22, 1, 0.36, 1)"
      : slideDirection === "prev"
        ? "calendarSlideFromLeft 700ms cubic-bezier(0.22, 1, 0.36, 1)"
        : undefined;

  return (
    <section className="relative mx-auto mt-8 w-full max-w-6xl rounded-3xl border border-slate-200 bg-slate-50/70 p-3 shadow-[0_28px_60px_rgba(15,23,42,0.16)] backdrop-blur-sm">
      <div className="pointer-events-none absolute left-1/2 -top-7.5 h-8 w-0.5 -translate-x-1/2 bg-slate-500" />
      <div className="pointer-events-none absolute left-1/2 -top-9 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-slate-500 bg-slate-100" />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="relative h-72 overflow-hidden sm:h-96 lg:h-120">
          <img
            src={heroImageError ? "/calendar-hero.svg" : heroImageUrl}
            alt={`${heroKeyword} themed wall calendar hero image`}
            className="h-full w-full object-cover"
            onError={() => setHeroImageError(true)}
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 via-slate-900/20 to-transparent" />
          <div className="absolute bottom-0 left-0 z-10 h-20 w-[46%] bg-sky-500/95 [clip-path:polygon(0_100%,0_15%,70%_100%)]" />
          <div className="absolute bottom-0 right-0 z-10 h-20 w-[56%] bg-sky-500/95 [clip-path:polygon(28%_100%,100%_14%,100%_100%)]" />

          <div className="absolute left-4 top-4 z-20 rounded-full border border-white/60 bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
            {heroKeyword}
          </div>

          <div className="absolute bottom-4 right-4 z-20 text-right text-white drop-shadow">
            <p className="text-3xl font-semibold leading-none sm:text-4xl">{visibleMonth.getFullYear()}</p>
            <span className="text-xl font-bold tracking-[0.14em]">{monthFormatter.format(visibleMonth).split(" ")[0].toUpperCase()}</span>
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <div className="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Calendar Grid</p>
                <h2 className="mt-1 text-4xl font-black tracking-tight text-slate-800 sm:text-5xl">{getMonthLabel(visibleMonth)}</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">{selectedDaysCount} selected</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">{monthDayNotesCount} day notes</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">{monthRangeNotesCount} range notes</span>
                </div>
              </div>

              <div className="inline-flex gap-2">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  aria-label="Previous month"
                  className="rounded-full border border-slate-300 bg-white p-2 text-slate-600 transition duration-200 hover:scale-105 hover:bg-slate-100 active:scale-95"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goToToday}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition duration-200 hover:scale-105 hover:bg-slate-100 active:scale-95"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  aria-label="Next month"
                  className="rounded-full border border-slate-300 bg-white p-2 text-slate-600 transition duration-200 hover:scale-105 hover:bg-slate-100 active:scale-95"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </header>

            <div className="mb-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-slate-600">
                {rangeStart && rangeEnd
                  ? `Range: ${rangeStart} to ${rangeEnd}`
                  : rangeStart
                    ? `Range starts at ${rangeStart}. Pick an end date.`
                    : "Select any day to begin a range."}
              </p>
              <button
                type="button"
                onClick={clearSelection}
                disabled={!rangeStart}
                className="w-fit rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1.5">
              {weekdayLabels.map((label) => (
                <span key={label} className="grid place-items-center py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {label}
                </span>
              ))}
            </div>

            <div
              key={getMonthLabel(visibleMonth)}
              className="grid content-start grid-cols-7 gap-1.5"
              style={monthSlideAnimation ? { animation: monthSlideAnimation } : undefined}
            >
              {monthGrid.map((date) => {
                const iso = toLocalISO(date);
                const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                const isToday = iso === todayISO;
                const isStart = iso === rangeStart;
                const isEnd = iso === rangeEnd;
                const isSelected = isWithinSelection(iso);
                const hasDay = Boolean(dayNotes[iso]);
                const hasRange = hasRangeNote(iso);
                const isBoundary = isStart || isEnd;

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => onDateClick(iso)}
                    className={cn(
                      "group flex min-h-12 flex-col justify-between rounded-xl px-1.5 py-1.5 text-left text-xs font-semibold transition duration-200",
                      !isCurrentMonth && "opacity-35",
                      isSelected && !isBoundary && "bg-sky-100/70",
                      isBoundary && "bg-sky-200/80",
                      !isSelected && "hover:scale-[1.03] hover:bg-slate-100",
                      isToday && "ring-2 ring-sky-400/70"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full transition",
                        isBoundary ? "bg-sky-600 text-white shadow" : "text-slate-700 group-hover:bg-white",
                        isToday && !isBoundary && "text-sky-700"
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <span className="inline-flex min-h-2 items-center gap-1">
                      {hasDay && <i className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" aria-label="Day note present" />}
                      {hasRange && <i className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" aria-label="Range note present" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="self-start space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Selected Range</p>
              <h3 className="mt-1 text-base font-semibold text-slate-800">Range Notes</h3>
              <p className="mt-1 text-xs text-slate-500">
                {rangeStart && rangeEnd
                  ? `${rangeStart} to ${rangeEnd}`
                  : rangeStart
                    ? `Start: ${rangeStart} (choose end date)`
                    : "Tap any day to start selecting a range"}
              </p>
              <textarea
                value={draftRangeNote}
                onChange={(event) => setDraftRangeNote(event.target.value)}
                placeholder="Attach a note to the selected range..."
                className="mt-3 min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <button
                type="button"
                onClick={saveRangeNote}
                disabled={!rangeStart || !rangeEnd || !draftRangeNote.trim()}
                className="mt-3 w-full rounded-full bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition duration-200 hover:bg-sky-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save Range Note
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Day Notes</p>
              <h3 className="mt-1 text-base font-semibold text-slate-800">Selected Day</h3>
              <p className="mt-1 text-xs text-slate-500">{activeDate ? `Selected: ${activeDate}` : "Tap a day to write a specific note"}</p>
              <textarea
                value={draftDayNote}
                onChange={(event) => setDraftDayNote(event.target.value)}
                placeholder="Write a note for the selected day..."
                disabled={!activeDate}
                className="mt-3 min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:opacity-40"
              />
              <button
                type="button"
                onClick={saveDayNote}
                disabled={!activeDate}
                className="mt-3 w-full rounded-full bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition duration-200 hover:bg-sky-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save Day Note
              </button>

              <button
                type="button"
                onClick={() => activeDate && deleteDayNote(activeDate)}
                disabled={!activeDate || !dayNotes[activeDate]}
                className="mt-2 w-full rounded-full border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition duration-200 hover:bg-rose-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete Day Note
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Saved Notes</p>
              <h3 className="mt-1 text-base font-semibold text-slate-800">Range Archive</h3>
              {rangeNotes.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No range notes yet. Save one from the selected range card.</p>
              ) : (
                <div className="mt-3 max-h-56 overflow-y-auto pr-1">
                  <ul className="grid gap-2">
                    {rangeNotes.map((note) => (
                      <li key={note.id} className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <div>
                          <strong className="text-[11px] text-slate-700">{note.start} - {note.end}</strong>
                          <p className="mt-0.5 text-xs text-slate-600">{note.text}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteRangeNote(note.id)}
                          className="rounded-full border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 border-t border-slate-200 pt-3">
                <h4 className="text-sm font-semibold text-slate-700">Spotlight Dates</h4>
                {spotlightNotes.length === 0 ? (
                  <p className="mt-1 text-xs text-slate-500">No daily notes in this month yet.</p>
                ) : (
                  <div className="mt-2 max-h-52 overflow-y-auto pr-1">
                    <ul className="grid gap-2">
                      {spotlightNotes.map(([date, note]) => (
                        <li key={date} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <strong className="text-[11px] text-slate-600">{date}</strong>
                              <p className="mt-0.5 text-xs text-slate-700">{note}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteDayNote(date)}
                              className="rounded-full border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
