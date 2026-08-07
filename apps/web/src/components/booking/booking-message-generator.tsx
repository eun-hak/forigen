"use client";

import { useMemo, useState } from "react";

export function BookingMessageGenerator({ placeName, defaultService, locale = "en" }: { placeName: string; defaultService: string; locale?: "en" | "ko" }) {
  const koreanUi = locale === "ko";
  const [service, setService] = useState(defaultService);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState<"en" | "ko" | null>(null);
  const english = useMemo(() => `Hello, I would like to book ${service || "a service"} at ${placeName}${date ? ` on ${date}` : ""}${time ? ` at ${time}` : ""}. I am an international visitor and speak English.${name ? ` My name is ${name}.` : ""} Is this available?`, [service, placeName, date, time, name]);
  const korean = useMemo(() => `안녕하세요. ${placeName}에서 ${service || "시술"} 예약을 원합니다.${date ? ` 날짜는 ${date}` : ""}${time ? ` ${time}` : ""}입니다. 외국인 방문객이며 영어로 소통하고 싶습니다.${name ? ` 이름은 ${name}입니다.` : ""} 예약 가능할까요?`, [service, placeName, date, time, name]);

  async function copy(text: string, language: "en" | "ko") {
    await navigator.clipboard.writeText(text);
    setCopied(language);
    window.setTimeout(() => setCopied(null), 1800);
  }

  return <div className="message-builder">
    <div className="message-fields">
      <label>{koreanUi ? "시술" : "Service"}<input value={service} onChange={(event) => setService(event.target.value)} placeholder={koreanUi ? "예: 헤어컷" : "e.g. Haircut"} /></label>
      <label>{koreanUi ? "날짜" : "Date"}<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <label>{koreanUi ? "희망 시간" : "Preferred time"}<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
      <label>{koreanUi ? "이름" : "Your name"}<input value={name} onChange={(event) => setName(event.target.value)} placeholder={koreanUi ? "선택 사항" : "Optional"} /></label>
    </div>
    <div className="message-output"><span>{koreanUi ? "영어 메시지" : "English message"}</span><p>{english}</p><button type="button" onClick={() => copy(english, "en")}>{copied === "en" ? (koreanUi ? "복사됨!" : "Copied!") : (koreanUi ? "영어 복사" : "Copy English")}</button></div>
    <div className="message-output"><span>{koreanUi ? "한국어 메시지" : "Korean message"}</span><p lang="ko">{korean}</p><button type="button" onClick={() => copy(korean, "ko")}>{copied === "ko" ? "복사됨!" : (koreanUi ? "한국어 복사" : "Copy Korean")}</button></div>
  </div>;
}
