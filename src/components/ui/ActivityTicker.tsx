import { motion } from "framer-motion";
import { Flame, Star, Package, Truck } from "lucide-react";

const items = [
  { icon: <Flame className="w-3.5 h-3.5 text-orange-500" />, text: "Fatima just shipped a Zellige Bowl to Paris 🇫🇷" },
  { icon: <Star className="w-3.5 h-3.5 text-amber-500" />, text: "Omar received a 5-star review from London 🇬🇧" },
  { icon: <Package className="w-3.5 h-3.5 text-primary" />, text: "New arrival: Egyptian Alabaster Vase by Mohamed Sabry" },
  { icon: <Truck className="w-3.5 h-3.5 text-green-600" />, text: "Hassan shipped a leather pouf to New York 🇺🇸" },
  { icon: <Flame className="w-3.5 h-3.5 text-orange-500" />, text: "Berber Wool Rug sold to a buyer in Tokyo 🇯🇵" },
  { icon: <Star className="w-3.5 h-3.5 text-amber-500" />, text: "Sara's papyrus painting earned a 5-star rating ⭐" },
  { icon: <Package className="w-3.5 h-3.5 text-primary" />, text: "Khadija's Zellige Mosaic Table — only 2 left in stock!" },
  { icon: <Truck className="w-3.5 h-3.5 text-green-600" />, text: "Nadia shipped an embroidered cushion to Berlin 🇩🇪" },
  { icon: <Flame className="w-3.5 h-3.5 text-orange-500" />, text: "Copper Lantern trending — 12 sold this week 🔥" },
  { icon: <Star className="w-3.5 h-3.5 text-amber-500" />, text: "Ahmed's brass tray got 5 new 5-star reviews today" },
];

const doubled = [...items, ...items];

export function ActivityTicker() {
  return (
    <div className="bg-foreground/95 text-background py-2.5 overflow-hidden border-t border-border/20">
      <div className="flex items-center">
        <div className="flex-shrink-0 px-4 text-xs font-bold uppercase tracking-widest text-primary bg-primary/20 py-1 rounded-r-full mr-4 whitespace-nowrap">
          🔴 Live
        </div>
        <div className="overflow-hidden flex-1">
          <motion.div
            className="flex gap-12 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, ease: "linear", repeat: Infinity }}
          >
            {doubled.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-xs text-background/80 flex-shrink-0">
                {item.icon}
                {item.text}
                <span className="text-background/30 mx-2">•</span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
