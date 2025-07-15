// src/App.jsx
import React, { useState } from "react";
import flightMap from "./flightMap";
import "./styles.css";

// KST 시간 표시 함수
function getKSTTime() {
  const now = new Date();
  return now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

// NOTAM 크롤링 함수 (공항 ICAO코드별)
async function fetchNotam(icao) {
  const res = await fetch(
    `https://corsproxy.io/?https://ourairports.com/airports/${icao}/notams.html`
  );
  const text = await res.text();
  const matches = text.match(/<section id=\"notam-.*?section>/gs);
  if (!matches) return "No NOTAM found.";
  return matches.map(m => m.replace(/<[^>]*>/g, "")).join("\n\n");
}

// 간단 번역 함수 (예시)
async function translate(text) {
  return text.replace(/(RUNWAY|TWY|CLSD|ACFT)/g, m =>
    ({
      RUNWAY: "활주로",
      TWY: "유도로",
      CLSD: "폐쇄",
      ACFT: "항공기"
    }[m] || m)
  );
}

export default function App() {
  const [flightNo, setFlightNo] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [notamText, setNotamText] = useState("");
  const [notamKR, setNotamKR] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!flightMap[flightNo]) {
      setFrom(""); setTo(""); setNotamText(""); setNotamKR("");
      return;
    }
    const [dep, arr] = flightMap[flightNo];
    setFrom(dep); setTo(arr);
    setLoading(true);
    const raw = await fetchNotam(dep);
    setNotamText(raw);
    setNotamKR(await translate(raw));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center font-sans">
      <header className="w-full bg-orange-400 text-white py-4 text-center text-2xl font-bold shadow-md">
        Jejuair NOTAM <span className="text-base font-normal ml-2">{getKSTTime()}</span>
      </header>
      <main className="w-full max-w-xl mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2 items-center">
          <span className="text-orange-700 font-semibold">
            편명만 입력해주세요. <span className="opacity-70">ex. 7C6001 → 6001</span>
          </span>
          <div className="flex gap-2 w-full">
            <input
              className="border rounded-lg px-3 py-2 flex-1"
              placeholder="편명을 입력하세요"
              value={flightNo}
              onChange={e => setFlightNo(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
            <button
              className="bg-orange-400 hover:bg-orange-500 text-white font-bold px-5 py-2 rounded-lg"
              onClick={handleSearch}
            >검색</button>
          </div>
        </div>
        {from && to &&
          <div className="text-center text-orange-800 mb-2">
            <b>출발:</b> {from} <b>→</b> <b>도착:</b> {to}
          </div>
        }
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-xl p-4 min-h-[200px]">
            <div className="text-lg font-semibold text-orange-700 mb-2">NOTAM 원문</div>
            {loading ? <span className="text-gray-400">불러오는 중...</span> : <pre className="whitespace-pre-wrap">{notamText}</pre>}
          </div>
          <div className="bg-orange-100 rounded-2xl shadow-xl p-4 min-h-[200px]">
            <div className="text-lg font-semibold text-orange-700 mb-2">번역(요약)</div>
            {loading ? <span className="text-gray-400">번역 중...</span> : <pre className="whitespace-pre-wrap">{notamKR}</pre>}
          </div>
        </div>
      </main>
    </div>
  );
}
