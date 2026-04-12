import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarProps = {
  label: React.ReactNode;
  imageUrl?: string;
  className?: string;
};

export function Avatar({ label, imageUrl, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#e8ebf4] text-sm font-semibold text-[#3345b8]",
        className,
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt="User avatar"
          width={40}
          height={40}
          className="h-full w-full object-cover"
          sizes="40px"
          loading="lazy"
          quality={70}
        />
      ) : (
        label
      )}
    </div>
  );
}