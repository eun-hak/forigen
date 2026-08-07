"use client";
import { SearchError } from "@/components/search-error";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) { return <SearchError locale="ko" reset={reset} />; }
