import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/components/providers/i18n-provider";

export function ShoppingListCard() {
  const { t } = useI18n();

  return (
    <Card className="bg-[#3345b8] text-white">
      <CardContent className="flex h-full flex-col p-5 md:p-6">
        {/* Icône */}
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
          <ShoppingCart size={18} />
        </div>

        {/* Titre + description */}
        <div className="mt-6">
          <h2 className="text-3xl font-bold leading-tight text-white">
            {t("shoppingCard.title")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/70">
            {t("shoppingCard.description")}
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <Link
          href="/shopping-list"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white transition-opacity hover:opacity-80"
        >
          {t("shoppingCard.cta")}
          <ArrowRight size={16} />
        </Link>
      </CardContent>
    </Card>
  );
}