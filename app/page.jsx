'use client';
import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const INITIAL_DATA = [
  { day: "2026-03-23", start: 70, end: 91 },
  { day: "2026-03-24", start: 91, end: 110 },
  { day: "2026-03-25", start: 110, end: 135 },
  { day: "2026-03-26", start: 135, end: 117 },
  { day: "2026-03-27", start: 117, end: 137 },
  { day: "2026-03-30", start: 137.74, end: 156.12 },
  { day: "2026-03-31", start: 156.12, end: 176.55 },
  { day: "2026-04-01", start: 176.55, end: 202.47 }
];

const getLocalDate = (str) => {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export default function Dashboard() {
  const [days, setDays] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2));
  const [selectedDate, setSelectedDate] = useState(null);
  const [inputStart, setInputStart] = useState("");
  const [inputEnd, setInputEnd] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [showTwoMonthView, setShowTwoMonthView] = useState(false);

  const computeDay = (data) => {
    const start = Number(data.start);
    const end = Number(data.end);
    const pct = ((end - start) / start) * 100;
    const pnl = end - start;
    return { ...data, start, end, pct, pnl };
  };

  useEffect(() => {
    const saved = localStorage.getItem("trading_days");
    if (saved) {
      setDays(JSON.parse(saved).map(computeDay));
    } else {
      setDays(INITIAL_DATA.map(computeDay).sort((a, b) => new Date(a.day) - new Date(b.day)));
    }
  }, []);

  useEffect(() => {
    if (days.length) localStorage.setItem("trading_days", JSON.stringify(days));
  }, [days]);

  const equityData = days.map((d) => ({ date: d.day, balance: d.end }));
  const startBalance = days.length ? days[0].start : 0;
  const currentBalance = days.length ? days[days.length - 1].end : 0;
  const totalGrowth = startBalance ? ((currentBalance - startBalance) / startBalance) * 100 : 0;
  const maxAbsPct = Math.max(...days.map((d) => Math.abs(d.pct || 0)), 1);

  const getHeatStyle = (d) => {
    if (!d || d.empty) return { backgroundColor: "#f3f4f6" };
    const intensity = Math.min(Math.abs(d.pct) / maxAbsPct, 1);
    const baseColor = d.pct >= 0
      ? `rgba(34,197,94, ${0.15 + intensity * 0.5})`
      : `rgba(239,68,68, ${0.15 + intensity * 0.5})`;
    return { backgroundColor: baseColor };
  };

  const changeMonth = (dir) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + dir);
    setCurrentDate(newDate);
  };

  const generateCalendar = (monthOffset = 0) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + monthOffset;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const map = {};
    days.forEach((d) => {
      const date = getLocalDate(d.day);
      if (date.getMonth() === month && date.getFullYear() === year) map[date.getDate()] = d;
    });

    const cal = [];
    for (let i = 0; i < firstDay; i++) cal.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      cal.push(map[i] || { empty: true, date: i, fullDate: `${year}-${month + 1}-${i}` });
    }
    return cal;
  };

  const getPrevEnd = (dateStr, list) => {
    const target = new Date(dateStr);
    const prev = list.filter(d => new Date(d.day) < target).sort((a, b) => new Date(b.day) - new Date(a.day))[0];
    return prev ? prev.end : null;
  };

  const saveDay = () => {
    if (!selectedDate) return;
    let updated = days.filter(d => d.day !== selectedDate);
    const prevEnd = getPrevEnd(selectedDate, updated);
    const startVal = prevEnd !== null ? prevEnd : Number(inputStart);
    updated.push(computeDay({ day: selectedDate, start: startVal, end: inputEnd }));
    const sorted = updated.sort((a, b) => new Date(a.day) - new Date(b.day));
    const chained = sorted.map((d, i) => i === 0 ? computeDay(d) : computeDay({ ...d, start: sorted[i - 1].end }));
    setDays(chained);
    setSelectedDate(null); setInputStart(""); setInputEnd("");
  };

  const deleteDay = () => {
    if (!selectedDate) return;
    setDays(days.filter(d => d.day !== selectedDate));
    setSelectedDate(null); setInputStart(""); setInputEnd("");
  };

  const exportData = () => {
    const dataStr = JSON.stringify(days, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trading-data.json";
    a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try { setDays(JSON.parse(event.target.result).map(computeDay)); }
      catch { alert("Invalid JSON file"); }
    };
    reader.readAsText(file);
  };

  // Multiple calendars for 2-month view
  const monthsToRender = showTwoMonthView ? [0, 1] : [0];

  return (
    <div className="min-h-screen bg-white p-10 flex justify-center">
      <div className="w-full max-w-7xl">
        <h1 className="text-4xl font-semibold mb-6">Orlando Dashboard</h1>

        <div className="flex gap-3 mb-6">
          <button onClick={exportData} className="px-4 py-2 border rounded-xl">Export JSON</button>
          <label className="px-4 py-2 border rounded-xl cursor-pointer">
            Import JSON
            <input type="file" accept="application/json" onChange={importData} className="hidden" />
          </label>
          <button onClick={() => setShowTwoMonthView(!showTwoMonthView)} className="px-4 py-2 border rounded-xl">
            {showTwoMonthView ? "Single Month View" : "2-Month View"}
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[{
            label: "Starting Balance", value: `$${startBalance.toFixed(2)}`
          }, {
            label: "Current Balance", value: `$${currentBalance.toFixed(2)}`
          }, {
            label: "Total Growth", value: `${totalGrowth.toFixed(1)}%`
          }].map((card, i) => (
            <div key={i} className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-lg rounded-2xl p-4 transition-transform duration-200 hover:scale-105">
              <div className="text-gray-500 text-sm">{card.label}</div>
              <div className="text-xl font-semibold">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Equity Chart */}
        <div className="h-64 mb-10 backdrop-blur-xl bg-white/60 border border-white/40 rounded-2xl p-4 shadow">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equityData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="balance" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => changeMonth(-1)} className="px-4 py-2 border rounded-xl">←</button>
          <h2 className="text-xl font-semibold text-center">
            {showTwoMonthView
              ? monthsToRender.map(mo => new Date(currentDate.getFullYear(), currentDate.getMonth() + mo).toLocaleString("default", { month: "short" })).join(" / ") + ` ${currentDate.getFullYear()}`
              : currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>
          <button onClick={() => changeMonth(1)} className="px-4 py-2 border rounded-xl">→</button>
        </div>

        {/* Calendars */}
        <div className={`grid ${showTwoMonthView ? "grid-cols-2" : "grid-cols-1"} gap-6`}>
          {monthsToRender.map((mo) => {
            const cal = generateCalendar(mo);
            return (
              <div key={mo}>
                <div className="grid grid-cols-7 mb-2 text-xs text-gray-400">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="text-center">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-3">
                  {cal.map((d, i) => (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => {
                        if (!d) return;
                        const date = d.fullDate || d.day;
                        setSelectedDate(date);
                        const existing = days.find(day => day.day === date);
                        if (existing) { setInputStart(existing.start); setInputEnd(existing.end); }
                        else { const prevEnd = getPrevEnd(date, days); setInputStart(prevEnd ?? ""); setInputEnd(""); }
                      }}
                      className="aspect-square rounded-xl p-2 cursor-pointer transition-transform duration-200 hover:scale-105 backdrop-blur-xl bg-white/50 border border-white/40"
                      style={{ ...getHeatStyle(d), ...(hoveredIndex === i && d && !d.empty ? { boxShadow: d.pct >= 0 ? `0 0 ${6 + Math.min(Math.abs(d.pct)/maxAbsPct,1)*14}px rgba(34,197,94,0.35)` : `0 0 ${6 + Math.min(Math.abs(d.pct)/maxAbsPct,1)*14}px rgba(239,68,68,0.35)` } : {}) }}
                    >
                      <div className="text-xs">{d ? (d.day ? getLocalDate(d.day).getDate() : d.date) : ""}</div>
                      {d && d.day && <>
                        <div className="text-sm font-semibold">{d.pct.toFixed(1)}%</div>
                        <div className="text-xs">${d.pnl.toFixed(2)}</div>
                      </>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Input Modal */}
        {selectedDate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl w-80">
              <h2 className="mb-3">Add Trade Day</h2>
              <div className="text-sm mb-2">{selectedDate}</div>
              <input placeholder="Start ($)" value={inputStart} onChange={e=>setInputStart(e.target.value)} className="w-full border p-2 mb-2 rounded"/>
              <input placeholder="End ($)" value={inputEnd} onChange={e=>setInputEnd(e.target.value)} className="w-full border p-2 mb-4 rounded"/>
              <button onClick={saveDay} className="w-full bg-black text-white py-2 rounded-xl">Save / Update</button>
              <button onClick={deleteDay} className="w-full mt-2 bg-red-500 text-white py-2 rounded-xl">Delete Day</button>
              <button onClick={()=>setSelectedDate(null)} className="w-full mt-2 border py-2 rounded-xl">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
