import type { AiTool } from "@/data/tools";

export function ToolMark({ tool, size = "md" }: { tool: Pick<AiTool, "initials" | "accent" | "name">; size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "sm" ? "h-9 w-9 text-[10px]" : size === "lg" ? "h-16 w-16 text-lg" : "h-11 w-11 text-xs";
  return (
    <div
      aria-label={`Ícono de ${tool.name}`}
      className={`tool-mark ${dimensions}`}
      style={{ background: `linear-gradient(135deg, ${tool.accent}, #08111f)` }}
    >
      {tool.initials}
    </div>
  );
}
