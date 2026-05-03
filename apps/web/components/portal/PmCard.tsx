"use client";

import { CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PmCardProps {
  name: string;
  role: string;
  status: "online" | "offline";
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/* ── Project Manager Card ───────────────────────────────────────────────
   Exact from source:
   - Card: border 1.5px solid #E1E4EA, radius 16px, bg #FFFFFF
   - Avatar: 82x82, border-radius 50%
   - Name: 24px weight 500 #000000
   - Role: 18px weight 400 rgba(0,0,0,0.6)
   - Online badge: bg rgba(14,213,137,0.1), text #0ED589, radius 12px
   - Button: bg rgba(28,39,77,0.1), text #1C274D, radius 16px
─────────────────────────────────────────────────────────────────────────── */
export function PmCard({ name, role, status }: PmCardProps) {
  return (
    <div
      className="p-5 bg-white space-y-5"
      style={{
        border: "1.5px solid #E1E4EA",
        borderRadius: 16,
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <h4
              style={{
                fontSize: 24,
                fontWeight: 500,
                lineHeight: "36px",
                color: "#000000",
              }}
            >
              {name}
            </h4>
            {status === "online" && (
              <span
                className="inline-flex items-center gap-1"
                style={{
                  padding: "4px 12px",
                  borderRadius: 12,
                  background: "rgba(14, 213, 137, 0.1)",
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: "21px",
                  color: "#0ED589",
                }}
              >
                متاح الآن
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    background: "#0ED589",
                  }}
                />
              </span>
            )}
          </div>
          <p
            className="mt-0.5"
            style={{
              fontSize: 18,
              fontWeight: 400,
              lineHeight: "27px",
              color: "rgba(0, 0, 0, 0.6)",
            }}
          >
            {role}
          </p>
        </div>
        <Avatar
          className="rounded-full shrink-0"
          style={{
            width: 82,
            height: 82,
          }}
        >
          <AvatarFallback
            className="rounded-full text-lg font-bold"
            style={{ backgroundColor: "#121936", color: "#fff" }}
          >
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
      </div>

      <button
        className="w-full"
        style={{
          height: 62,
          background: "rgba(28, 39, 77, 0.1)",
          borderRadius: 16,
          fontSize: 16,
          fontWeight: 600,
          lineHeight: "164.9%",
          color: "#1C274D",
        }}
      >
        تواصل معه
      </button>
    </div>
  );
}
