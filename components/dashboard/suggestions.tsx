import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { suggestions } from "./data";

export function Suggestions() {
  return (
    <Card className="mt-4 bg-[#f0f1f6]">
      <CardContent className="p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={14} className="text-[#3345b8]" />
          <h2 className="text-3xl font-semibold text-[#212329]">AI Stock Optimization Suggestions</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion.title} className="rounded-2xl bg-white p-4">
              <Badge className="mb-3">{suggestion.tag}</Badge>
              <h3 className="text-lg font-semibold text-[#22242a]">{suggestion.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6b7182]">{suggestion.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}