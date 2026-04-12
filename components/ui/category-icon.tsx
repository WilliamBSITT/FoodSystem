import * as LucideIcons from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { type Category } from "@/hooks/useInventory";

const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})/;

function extractHexColor(value: string | null | undefined) {
  return value?.match(HEX_COLOR_REGEX)?.[0] ?? null;
}

interface CategoryIconProps {
  category?: Category;
}

export function CategoryIcon({ category }: CategoryIconProps) {
  if (!category) {
    return <Avatar label="📦" className="h-14 w-14 text-2xl" />;
  }

  const rawIcon = (category.icon ?? "").trim();
  const pascalIcon = rawIcon
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");

  const iconCandidate =
    LucideIcons[rawIcon as keyof typeof LucideIcons] ?? LucideIcons[pascalIcon as keyof typeof LucideIcons];
  const Icon = (iconCandidate ?? LucideIcons.Package) as LucideIcons.LucideIcon;
  const backgroundColor = extractHexColor(category.bg);
  const textColor = extractHexColor(category.color);

  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${backgroundColor ? "" : category.bg}`}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <Icon size={26} className={textColor ? "" : category.color} style={textColor ? { color: textColor } : undefined} />
    </div>
  );
}
